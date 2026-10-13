"""Offline-only line-art compiler. Original pixels are never repaired in place.

python compile_raster.py input.png --id sample --theme animals --title なかまたち
    --expected-min 20 --expected-max 25 --output tools/asset-pipeline/output/sample

PYTHONPATH may point at .local/python-packages for the isolated Windows runtime.
All generated packages remain unapproved until the Japanese review workflow.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import re
import shutil
import sys

ROOT = Path(__file__).resolve().parents[2]
LOCAL = ROOT / '.local' / 'python-packages'
if LOCAL.exists():
    sys.path.insert(0, str(LOCAL))
import cv2
import numpy as np

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')


def write_image(file: Path, image: np.ndarray) -> None:
    ok, encoded = cv2.imencode(file.suffix, image)
    if not ok:
        raise ValueError(f'画像を保存できません: {file.name}')
    file.write_bytes(encoded.tobytes())


def component_regions(ink: np.ndarray, min_area: int = 240):
    count, labels, stats, centers = cv2.connectedComponentsWithStats(255 - ink, connectivity=8)
    height, width = ink.shape
    outside = set(np.unique(np.concatenate((labels[0], labels[-1], labels[:, 0], labels[:, -1]))))
    regions, tiny = [], []
    for label in range(1, count):
        if label in outside:
            continue
        x, y, w, h, area = map(int, stats[label])
        item = {'label': label, 'x': x, 'y': y, 'width': w, 'height': h, 'area': area,
                'center': centers[label].tolist()}
        (regions if area >= min_area else tiny).append(item)
    # Position ordering remains deterministic across repeated builds.
    regions.sort(key=lambda item: (round(item['y'] / 60), item['x'], item['area']))
    return labels, regions, tiny, outside


def path_from_mask(mask: np.ndarray, sx: float, sy: float, epsilon: float = 0.65) -> tuple[str, int]:
    contours, _ = cv2.findContours(mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE)
    parts = []
    points_count = 0
    for contour in contours:
        contour = cv2.approxPolyDP(contour, epsilon, True)
        points = contour[:, 0]
        if len(points) < 3:
            continue
        # OpenCV produces opposite winding for holes, compatible with Path2D's nonzero fill.
        parts.append('M ' + ' L '.join(f'{float(x*sx):.2f} {float(y*sy):.2f}' for x, y in points) + ' Z')
        points_count += len(points)
    return ' '.join(parts), points_count


def gap_candidate_identity(original_sha, region, mask, parent_id, parent_name, exterior, sx, sy):
    distance = cv2.distanceTransform(mask, cv2.DIST_L2, 5)
    peak_y, peak_x = np.unravel_index(np.argmax(distance), distance.shape)
    bounds = [region['x'] * sx, region['y'] * sy, region['width'] * sx, region['height'] * sy]
    point = [float(peak_x * sx), float(peak_y * sy)]
    mask_sha = hashlib.sha256(mask.tobytes()).hexdigest()
    fields = [original_sha, region['kind'], mask_sha, parent_id or 'exterior', 'exterior' if exterior else 'enclosed']
    fields += [f'{value:.6f}' for value in bounds + point]
    return {'candidateKey': 'gap-' + hashlib.sha256('|'.join(fields).encode()).hexdigest(),
            'originalSha256': original_sha, 'maskSha256': mask_sha,
            'kind': region['kind'], 'parentRegionId': parent_id, 'parentRegionName': parent_name,
            'parentExteriorConnected': exterior, 'labelPoint': point, 'bounds': bounds,
            'area': region['area'] * sx * sy,
            'usableDiameter': round(float(np.max(distance) * 2 * sx), 3)}


def match_gap_review(candidate, decisions):
    """Never match by display index or merely trust a free-form reason."""
    matches = [item for item in decisions if item.get('candidateKey') == candidate['candidateKey']]
    if len(matches) != 1:
        return None
    item = matches[0]
    for key in ('originalSha256', 'kind', 'parentRegionId', 'parentRegionName', 'parentExteriorConnected'):
        if key not in item or item[key] != candidate[key]:
            return None
    expected = 'background' if candidate['parentExteriorConnected'] else 'intentional-open-detail'
    if (item.get('point') != candidate['labelPoint'] or item.get('classification') != expected or
            not isinstance(item.get('part'), str) or not item['part'].strip() or
            not isinstance(item.get('reason'), str) or not item['reason'].strip()):
        return None
    return item


def compile_image(source: Path, output: Path, template_id: str, theme: str, title: str,
                  expected_min: int, expected_max: int, min_area: int = 240,
                  fit_safe_page: bool = False, advisory_count: bool = False,
                  annotations: Path | None = None, evidence_source: Path | None = None) -> dict:
    if not re.fullmatch(r'[a-z][a-z0-9-]{1,63}', template_id):
        raise ValueError('IDは英小文字・数字・ハイフンで2〜64文字にしてください')
    if not 1 <= expected_min <= expected_max <= 300:
        raise ValueError('想定領域数は1〜300の範囲で指定してください')
    raw = np.frombuffer(source.read_bytes(), dtype=np.uint8)
    frozen_qa = None
    if evidence_source:
        frozen_qa = json.loads((evidence_source / 'qa.json').read_text(encoding='utf-8'))
        if frozen_qa.get('originalSha256') != hashlib.sha256(raw).hexdigest() or frozen_qa.get('templateId') != template_id:
            raise ValueError('保持する操作証拠の原画hashまたはIDが一致しません')
    original = cv2.imdecode(raw, cv2.IMREAD_UNCHANGED)
    if original is None:
        raise ValueError('原画を読み込めません')
    if original.ndim == 2:
        color = cv2.cvtColor(original, cv2.COLOR_GRAY2BGR)
    elif original.shape[2] == 4:
        alpha = original[:, :, 3:4].astype(np.float32) / 255
        color = (original[:, :, :3] * alpha + 255 * (1 - alpha)).astype(np.uint8)
    else:
        color = original[:, :, :3]
    original_height, original_width = color.shape[:2]
    normalization = None
    if fit_safe_page:
        # A single similarity transform fits the WHOLE original page inside the
        # safe area. Never crop, redraw, inpaint, or stretch the generated contours.
        factor = min((1600 - 256) / original_width, (2000 - 256) / original_height)
        fitted_width, fitted_height = round(original_width * factor), round(original_height * factor)
        left, top = (1600 - fitted_width) // 2, (2000 - fitted_height) // 2
        page = np.full((2000, 1600, 3), 255, np.uint8)
        page[top:top + fitted_height, left:left + fitted_width] = cv2.resize(
            color, (fitted_width, fitted_height), interpolation=cv2.INTER_LANCZOS4)
        color = page
        normalization = {'method': 'contain-whole-page-on-white', 'scale': factor,
                         'offset': [left, top], 'imageSize': [fitted_width, fitted_height],
                         'canvasSize': [1600, 2000], 'safeMargin': 128,
                         'cropped': False, 'contoursRedrawn': False}
    gray = cv2.cvtColor(color, cv2.COLOR_BGR2GRAY)
    height, width = gray.shape
    sx, sy = 1600 / width, 2000 / height
    errors, warnings = [], []
    if width * 5 != height * 4:
        errors.append('アスペクト比は4:5である必要があります')
    if min(original_width, original_height) < 800:
        errors.append('原画の解像度が低すぎます（幅800px以上）')
    chroma = np.max(color, axis=2).astype(np.int16) - np.min(color, axis=2).astype(np.int16)
    if float(np.mean(chroma > 8)) > 0.002:
        errors.append('線画に色が含まれています')
    _, ink = cv2.threshold(gray, 180, 255, cv2.THRESH_BINARY_INV)
    black_ratio = float(np.mean(ink > 0))
    gray_ratio = float(np.mean((gray > 30) & (gray < 220)))
    if not 0.005 < black_ratio < 0.25:
        errors.append('黒線と白背景の面積比が規格外です')
    if gray_ratio > 0.03:
        errors.append('グレー・陰影・アンチエイリアスが多すぎます')
    # Close only 1–3 source pixels. Visible original is always preserved separately.
    closed = cv2.morphologyEx(ink, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
    _, raw_regions, _, _ = component_regions(ink, min_area)
    labels, regions, tiny, outside = component_regions(closed, min_area)
    detected_region_count = len(regions)
    original_region_ids = {region['label']: f'r{index+1:02d}' for index, region in enumerate(regions)}
    review, reviewed_regions, background_labels, detail_labels = None, {}, set(), set()
    if annotations:
        review = json.loads(annotations.read_text(encoding='utf-8'))
        if review.get('originalSha256') != hashlib.sha256(raw).hexdigest() or review.get('coordinateSpace') != 'normalized-1600x2000':
            raise ValueError('注釈の原画像hashまたは座標系が一致しません')
        if not review.get('reviewer') or not isinstance(review.get('regions'), list):
            raise ValueError('注釈には技術確認者と領域の一覧が必要です')
        for entry in review['regions']:
            point = entry.get('point', [])
            if len(point) != 2 or not 0 <= point[0] < 1600 or not 0 <= point[1] < 2000:
                raise ValueError('注釈座標は1600×2000の内側に指定してください')
            label = int(labels[int(point[1] / sy), int(point[0] / sx)])
            if label == 0 or label in outside or label in reviewed_regions:
                raise ValueError('注釈座標が黒線・外背景・重複領域を指しています')
            if entry.get('role') not in ('paint', 'background', 'line-detail') or not entry.get('name') or not entry.get('reason'):
                raise ValueError('注釈にはpaint/background/line-detail・日本語名・判断理由が必要です')
            reviewed_regions[label] = entry
            if entry['role'] == 'background':
                background_labels.add(label)
            if entry['role'] == 'line-detail':
                detail_labels.add(label)
        for issue in review.get('unresolvedLeaks', []):
            errors.append(f'目視確認した漏れ: {issue}')
    excluded_backgrounds = [item for item in regions + tiny if item['label'] in background_labels]
    excluded_details = [item for item in regions + tiny if item['label'] in detail_labels]
    if any(item['area'] >= min_area for item in excluded_details):
        raise ValueError('line-detailは目視確認済みの極小の線交差ノイズに限ります。通常の塗り領域を除外できません')
    regions = [item for item in regions if item['label'] not in background_labels | detail_labels]
    tiny = [item for item in tiny if item['label'] not in background_labels | detail_labels]
    repaired = max(0, detected_region_count - len(raw_regions))
    # Detect a suspicious gap that a larger closure could conceal; never adopt it.
    large_close = cv2.morphologyEx(ink, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    large_labels, large_regions, _, _ = component_regions(large_close, min_area)
    # Record where large closure changes topology. A cut subdividing an existing
    # region can be an intentional open crease; a component newly enclosed from
    # the page exterior may be a leak. Both require visual review, not auto-fix.
    grouped = {}
    for region in large_regions:
        mask = large_labels == region['label']
        parent_labels, overlap = np.unique(labels[mask], return_counts=True)
        parent = int(parent_labels[np.argmax(overlap)])
        grouped.setdefault(parent, []).append(region)
    gap_regions = []
    for parent, members in grouped.items():
        if parent in background_labels | detail_labels:
            continue
        candidates = members if parent in outside else sorted(members, key=lambda item: item['area'], reverse=True)[1:]
        for region in candidates:
            gap_regions.append({**region, 'parentLabel': parent, 'kind': 'new-from-background' if parent in outside else 'split-open-detail'})
    large_gap_candidates = len(gap_regions)
    unresolved_gap_count = 0
    for region in gap_regions:
        decisions = [] if not review else review.get('gapReviews', [])
        parent = region['parentLabel']
        exterior = parent in outside
        parent_id = original_region_ids.get(parent)
        parent_name = '外背景' if exterior else reviewed_regions.get(parent, {}).get('name', parent_id)
        mask = (large_labels == region['label']).astype(np.uint8) * 255
        region['identity'] = gap_candidate_identity(hashlib.sha256(raw).hexdigest(), region, mask,
                                                    parent_id, parent_name, exterior, sx, sy)
        decision = match_gap_review(region['identity'], decisions)
        if decision:
            region['review'] = decision
        else:
            unresolved_gap_count += 1
    if review:
        known_keys = {region['identity']['candidateKey'] for region in gap_regions}
        if any(item.get('candidateKey') not in known_keys for item in review.get('gapReviews', [])):
            errors.append('線切れ候補の注釈が現在の原画・座標・親領域に対応していません')
    if unresolved_gap_count:
        errors.append(f'大きな線切れの未確認候補: {unresolved_gap_count}箇所。自動修復しません')
    if large_gap_candidates > unresolved_gap_count:
        warnings.append(f'9px close候補 {large_gap_candidates - unresolved_gap_count}箇所は元画像と照合し意図的な開線・背景と技術確認（原画・maskの追加修復なし）')
    # A single-pixel dilation is a separate proposal, never silently used for approval.
    dilated = cv2.dilate(closed, np.ones((2, 2), np.uint8))
    _, dilation_regions, _, _ = component_regions(dilated, min_area)
    if len(dilation_regions) > len(regions):
        warnings.append('1pxの線拡張で閉じる候補があります。解析マスクを確認してください')
    if not expected_min <= len(regions) <= expected_max:
        (warnings if advisory_count else errors).append(f'領域数 {len(regions)} が目安 {expected_min}〜{expected_max} の範囲外です')
    if tiny:
        warnings.append(f'極小領域が {len(tiny)} 個あります（承認前に原画を確認）')
        errors.append('極小の閉領域があります')
    margin = max(1, round(128 / sx))
    if np.any(ink[:margin]) or np.any(ink[-margin:]) or np.any(ink[:, :margin]) or np.any(ink[:, -margin:]):
        errors.append('黒線が安全マージン128px内に入っています')
    output.mkdir(parents=True, exist_ok=True)
    for stale in output.glob('mask-r*.png'):
        if re.fullmatch(r'mask-r\d+\.png', stale.name):
            stale.unlink()
    destination = output / f'original{source.suffix.lower()}'
    if source.resolve() != destination.resolve():
        shutil.copyfile(source, destination)
    write_image(output / 'normalized-lineart.png', color)
    if annotations and annotations.resolve() != (output / 'analysis-review.json').resolve():
        shutil.copyfile(annotations, output / 'analysis-review.json')
    write_image(output / 'grayscale.png', gray)
    write_image(output / 'analysis-mask.png', 255 - closed)
    write_image(output / 'analysis-dilate-candidate.png', 255 - dilated)
    gap_debug = color.copy()
    gap_metrics = []
    for index, region in enumerate(gap_regions):
        x, y, w, h = region['x'], region['y'], region['width'], region['height']
        cv2.rectangle(gap_debug, (x - 3, y - 3), (x + w + 3, y + h + 3), (0, 0, 220), 2)
        cv2.putText(gap_debug, f'g{index+1:02d}', (x, max(14, y - 5)), cv2.FONT_HERSHEY_SIMPLEX, .55, (0, 0, 220), 2)
        gap_metrics.append({'id': f'g{index+1:02d}', **region['identity'], 'review': region.get('review')})
    write_image(output / 'analysis-gap-candidates.png', gap_debug)
    # Distinct debug colors use a fixed golden-angle sequence, never runtime randomness.
    debug = np.full((height, width, 3), 255, np.uint8)
    compiled = []
    region_metrics = []
    width_exceptions = []
    contour_points = 0
    for index, region in enumerate(regions):
        mask = np.where(labels == region['label'], 255, 0).astype(np.uint8)
        distance = cv2.distanceTransform(mask, cv2.DIST_L2, 5)
        max_width = float(np.max(distance) * 2 * sx)
        if region['area'] > width * height * 0.55:
            errors.append(f'領域{index+1}: 異常に大きく背景漏れの疑いがあります')
        svg_path, points_count = path_from_mask(mask, sx, sy)
        contour_points += points_count
        if not svg_path or points_count > 12000:
            errors.append(f'領域{index+1}: contourが不正または複雑すぎます')
        region_id = original_region_ids[region['label']]
        annotation = reviewed_regions.get(region['label'], {})
        if max_width < 24 or annotation.get('widthException'):
            exception = annotation.get('widthException')
            valid_exception = False
            if exception and exception.get('reason'):
                evidence_file = (ROOT / exception.get('evidenceFile', '')).resolve()
                evidence_base = (ROOT / 'content/generated-lineart/interaction').resolve()
                if frozen_qa:
                    frozen = next((item for item in frozen_qa.get('widthExceptions', []) if item['id'] == region_id), None)
                    if not frozen or not re.fullmatch(r'interaction-[a-f0-9]{64}\.json', frozen.get('evidenceSnapshot', '')):
                        raise ValueError(f'{region_id}: 保持する固定操作証拠がありません')
                    evidence_base = evidence_source.resolve()
                    evidence_file = (evidence_base / frozen['evidenceSnapshot']).resolve()
                    if hashlib.sha256(evidence_file.read_bytes()).hexdigest() != frozen['evidenceSha256']:
                        raise ValueError(f'{region_id}: 保持する固定操作証拠のhashが一致しません')
                if evidence_file.is_relative_to(evidence_base) and evidence_file.is_file():
                    evidence = json.loads(evidence_file.read_text(encoding='utf-8'))
                    proof = next((item for item in evidence.get('regions', []) if item.get('id') == region_id), {})
                    secondary_width = exception.get('secondaryUsableDiameter', max_width)
                    valid_exception = (max_width >= 17 and 17 <= secondary_width < 24 and evidence.get('templateId') == template_id and
                        evidence.get('originalSha256') == hashlib.sha256(raw).hexdigest() and
                        proof.get('pathSha256') == hashlib.sha256(svg_path.encode()).hexdigest() and
                        all(proof.get(key) is True for key in ('hitAtZoom4', 'painted', 'erased')))
                    if valid_exception:
                        evidence_bytes = evidence_file.read_bytes()
                        evidence_sha = hashlib.sha256(evidence_bytes).hexdigest()
                        # Snapshot exact evidence beside the compiler output. Later
                        # interaction runs must not rewrite a published QA basis.
                        evidence_snapshot = f'interaction-{evidence_sha}.json'
                        (output / evidence_snapshot).write_bytes(evidence_bytes)
                        width_exceptions.append({'id': region_id, 'name': annotation['name'],
                                                 'usableDiameter': round(max_width, 3), **exception,
                                                 'evidenceSha256': evidence_sha, 'evidenceSnapshot': evidence_snapshot})
            if valid_exception:
                warnings.append(f'{region_id}: 幅 {max_width:.1f}px。個別注釈と4×操作・塗り消去の実測証拠付き例外')
            elif max_width < 24:
                errors.append(f'{region_id}: 幅24pxの塗れる場所がありません（実測 {max_width:.1f}px）')
        peak_y, peak_x = np.unravel_index(np.argmax(distance), distance.shape)
        region_metrics.append({'id': region_id, 'area': region['area'] * sx * sy,
                               'usableDiameter': round(max_width, 3),
                               'labelPoint': [round(float(peak_x * sx), 2), round(float(peak_y * sy), 2)],
                               'bounds': [region['x'] * sx, region['y'] * sy,
                                          region['width'] * sx, region['height'] * sy]})
        region_seed = int(hashlib.sha256(f'{template_id}:{region_id}'.encode()).hexdigest()[:8], 16)
        # Raster material guesses are explicitly low-confidence and require review.
        metadata = {key: annotation[key] for key in ('name', 'material', 'confidence', 'shade', 'highlight', 'texture', 'direction') if key in annotation}
        compiled.append({'id': region_id, 'name': f'領域 {index+1}', 'path': svg_path,
                         'bounds': {'x': region['x'] * sx, 'y': region['y'] * sy,
                                    'width': region['width'] * sx, 'height': region['height'] * sy},
                         'material': 'standard', 'confidence': 0.25, 'shade': True,
                         'highlight': True, 'texture': 0.35, 'direction': 90, 'seed': region_seed, **metadata})
        hsv = np.uint8([[[(index * 69) % 180, 96, 235]]])
        debug[mask > 0] = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)[0, 0]
        cv2.putText(debug, region_id, (max(0, int(peak_x) - 13), int(peak_y) + 4),
                    cv2.FONT_HERSHEY_SIMPLEX, .40, (30, 30, 30), 1, cv2.LINE_AA)
        write_image(output / f'mask-{region_id}.png', mask)
    debug[ink > 0] = 0
    write_image(output / 'debug-regions.png', debug)
    # Preserve all original ink as its own vector layer (including open mouth/eyelash
    # details). Morphological fixes influence masks only, never the visible ink.
    original_ink_path, original_ink_points = path_from_mask(ink, sx, sy, epsilon=.25)
    if not original_ink_path:
        errors.append('原画の黒線をSVGへ変換できません')
    white_details = []
    for item in excluded_details:
        detail_path, _ = path_from_mask(np.where(labels == item['label'], 255, 0).astype(np.uint8), sx, sy, epsilon=.25)
        if detail_path:
            white_details.append({'path': detail_path, 'fill': '#ffffff', 'strokeWidth': 0})
    template = {'schemaVersion': 1, 'id': template_id, 'themeId': theme, 'title': title,
                'width': 1600, 'height': 2000, 'defaultColorFamily': 'blue', 'approved': False,
                'regions': compiled, 'details': white_details + [{'path': original_ink_path, 'fill': '#000000', 'strokeWidth': 0}], 'lineWidth': 0}
    template_bytes = json.dumps(template, ensure_ascii=False, indent=2).encode('utf-8')
    report = {'pass': not errors, 'templateId': template_id, 'approved': False,
              'approvalRequired': True, 'originalSha256': hashlib.sha256(raw).hexdigest(),
              'compilerVersion': 2, 'templateSha256': hashlib.sha256(template_bytes).hexdigest(),
              'normalizedSha256': hashlib.sha256((output / 'normalized-lineart.png').read_bytes()).hexdigest(),
              'originalSize': [original_width, original_height], 'analysisSize': [width, height],
              'normalization': normalization, 'regionCount': len(regions),
              'detectedRegionCount': detected_region_count,
              'countPolicy': 'advisory' if advisory_count else 'strict',
              'countWithinExpectedRange': expected_min <= len(regions) <= expected_max,
              'expectedRange': [expected_min, expected_max], 'smallRepairCandidates': repaired,
              'largeGapCandidates': large_gap_candidates, 'dilationApplied': False,
              'unreviewedLargeGapCandidates': unresolved_gap_count,
              'gapCandidateDetails': gap_metrics, 'gapReviewSchemaVersion': 2,
              'tinyRegions': len(tiny), 'blackRatio': black_ratio, 'grayRatio': gray_ratio,
              'backgroundComponentsExcluded': len(outside - {0}), 'contourPoints': contour_points,
              'originalInkContourPoints': original_ink_points,
              'minimumUsableDiameter': min((item['usableDiameter'] for item in region_metrics), default=0),
              'regions': region_metrics,
              'tinyRegionBounds': [[item['x'] * sx, item['y'] * sy, item['width'] * sx, item['height'] * sy] for item in tiny],
              'tinyRegionDetails': [],
              'materialReviewRequired': any(re.fullmatch(r'領域\s*\d+', region['name']) or region['confidence'] < .75 for region in compiled),
              'annotationSha256': hashlib.sha256(annotations.read_bytes()).hexdigest() if annotations else None,
              'technicalSemanticReview': {'reviewer': review['reviewer'], 'checks': review.get('checks', []),
                                          'unresolvedLeaks': review.get('unresolvedLeaks', [])} if review else None,
              'excludedBackgroundRegions': [{'name': reviewed_regions[item['label']]['name'], 'reason': reviewed_regions[item['label']]['reason'], 'bounds': [item['x'] * sx, item['y'] * sy, item['width'] * sx, item['height'] * sy]} for item in excluded_backgrounds],
              'widthExceptions': width_exceptions,
              'excludedLineDetails': [{'name': reviewed_regions[item['label']]['name'], 'reason': reviewed_regions[item['label']]['reason'], 'area': item['area'] * sx * sy} for item in excluded_details],
              'visibleInkSource': 'original-threshold-contours; no morphological repair or extra region stroke',
              'errors': errors, 'warnings': warnings,
              'publicationNote': '原画と解析maskを別保存。素材・細部・輪郭の人間確認後に公開してください。'}
    for item in tiny:
        mask = np.where(labels == item['label'], 255, 0).astype(np.uint8)
        distance = cv2.distanceTransform(mask, cv2.DIST_L2, 5)
        py, px = np.unravel_index(np.argmax(distance), distance.shape)
        report['tinyRegionDetails'].append({'point': [float(px * sx), float(py * sy)],
                                            'area': item['area'] * sx * sy,
                                            'usableDiameter': float(np.max(distance) * 2 * sx),
                                            'bounds': [item['x'] * sx, item['y'] * sy, item['width'] * sx, item['height'] * sy]})
    (output / 'template.json').write_bytes(template_bytes)
    (output / 'qa.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 2000">' + ''.join(
        f'<path id="{r["id"]}" d="{r["path"]}" fill="white"/>' for r in compiled) + ''.join(f'<path d="{d["path"]}" fill="{d["fill"]}"/>' for d in template['details']) + '</svg>'
    (output / 'regions.svg').write_text(svg, encoding='utf-8')
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description='塗り絵の原画を閉領域へ変換する制作専用ツール')
    parser.add_argument('source', type=Path)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--id', required=True)
    parser.add_argument('--theme', required=True, choices=['princess','magic','animals','ocean','dinosaurs','vehicles','construction','robots','space','food','flowers','toys'])
    parser.add_argument('--title', required=True)
    parser.add_argument('--expected-min', type=int, required=True)
    parser.add_argument('--expected-max', type=int, required=True)
    parser.add_argument('--fit-safe-page', action='store_true', help='原画全体を比率保持で1600×2000の安全領域へ配置（原画像は別保存）')
    parser.add_argument('--advisory-count', action='store_true', help='仕様の約領域数を警告として記録。幅・漏れ・極小の不合格は維持')
    parser.add_argument('--annotations', type=Path, help='原画hashと座標に結び付いた背景除外・素材の技術注釈')
    options = parser.parse_args()
    report = compile_image(options.source, options.output, options.id, options.theme, options.title,
                           options.expected_min, options.expected_max, fit_safe_page=options.fit_safe_page,
                           advisory_count=options.advisory_count, annotations=options.annotations)
    print(json.dumps({key: value for key, value in report.items() if key not in ('regions', 'tinyRegionBounds', 'gapCandidateDetails')}, ensure_ascii=False, indent=2))
    return 0 if report['pass'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
