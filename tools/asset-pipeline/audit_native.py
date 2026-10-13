"""Independent OpenCV QA of native and generated runtime region-ID rasters."""
from pathlib import Path
import hashlib
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / '.local' / 'python-packages'))
import cv2
import numpy as np


def digest(data):
    return hashlib.sha256(data).hexdigest()


def template_hash(template):
    return digest(json.dumps({**template, 'approved': False}, ensure_ascii=False,
                             separators=(',', ':')).encode('utf-8'))


def decode_regions(png_bytes, metadata, template):
    """Decode only exact palette colors, matching build's antialias exclusion."""
    if metadata.get('schemaVersion') != 1 or metadata.get('encoding') not in ('native-red8', 'palette-rgb8'):
        raise ValueError('Unknown region-ID raster format; rebuild the assets')
    if (metadata.get('templateId') != template['id'] or
            metadata.get('templateHash') != template_hash(template) or
            metadata.get('pngSha256') != digest(png_bytes)):
        raise ValueError('Region-ID metadata, template, and PNG hashes do not match')
    image = cv2.imdecode(np.frombuffer(png_bytes, np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError('Region-ID PNG cannot be decoded')
    height, width = image.shape[:2]
    if (metadata.get('rasterSize') != [width, height] or
            metadata.get('logicalSize') != [template['width'], template['height']]):
        raise ValueError('Region-ID raster dimensions do not match its metadata')
    scale_x, scale_y = template['width'] / width, template['height'] / height
    if abs(scale_x - scale_y) > 1e-9:
        raise ValueError('Region-ID raster must have a uniform logical scale')
    palette = metadata.get('palette', [])
    if [entry['id'] for entry in palette] != [region['id'] for region in template['regions']]:
        raise ValueError('Region-ID palette order does not match template regions')
    packed = (image[:, :, 2].astype(np.uint32) << 16) | (image[:, :, 1].astype(np.uint32) << 8) | image[:, :, 0]
    labels = np.zeros((height, width), np.uint16)
    seen = {0}
    for index, entry in enumerate(palette):
        rgb = entry['rgb']
        if len(rgb) != 3 or any(type(value) is not int or not 0 <= value <= 255 for value in rgb):
            raise ValueError('Invalid region-ID palette color')
        code = rgb[0] * 65536 + rgb[1] * 256 + rgb[2]
        if code in seen:
            raise ValueError('Region-ID palette colors must be unique and nonblack')
        seen.add(code)
        labels[packed == code] = index + 1
    return labels, scale_x


def verified_width_exceptions(template, directory):
    """An old PASS alone never waives a width: recheck the frozen operation proof."""
    qa_file = directory / 'qa.json'
    if not qa_file.exists():
        return {}
    qa = json.loads(qa_file.read_text(encoding='utf-8'))
    source_bytes = (directory / 'template.json').read_bytes()
    original = next(directory.glob('original.*'))
    if (qa['templateId'] != template['id'] or qa['templateSha256'] != digest(source_bytes) or
            qa['originalSha256'] != digest(original.read_bytes())):
        raise ValueError('Width exception original/template hashes do not match')
    source = json.loads(source_bytes)
    if [(r['id'], r['path']) for r in source['regions']] != [(r['id'], r['path']) for r in template['regions']]:
        raise ValueError('Width exception geometry does not match the current template')
    exceptions = {}
    for item in qa.get('widthExceptions', []):
        filename = item.get('evidenceSnapshot', '')
        if not re.fullmatch(r'interaction-[a-f0-9]{64}\.json', filename):
            raise ValueError('Width exception has no immutable interaction snapshot')
        evidence_bytes = (directory / filename).read_bytes()
        evidence = json.loads(evidence_bytes)
        proof = next((r for r in evidence['regions'] if r['id'] == item['id']), {})
        region = next((r for r in template['regions'] if r['id'] == item['id']), {})
        width = item.get('secondaryUsableDiameter', item['usableDiameter'])
        if (digest(evidence_bytes) != item['evidenceSha256'] or
                evidence['templateId'] != template['id'] or evidence['originalSha256'] != qa['originalSha256'] or
                proof.get('pathSha256') != digest(region.get('path', '').encode('utf-8')) or
                not all(proof.get(key) is True for key in ('hitAtZoom4', 'painted', 'erased')) or
                item['usableDiameter'] < 17 or not 17 <= width < 24):
            raise ValueError('Width exception does not match original, path, and interaction evidence')
        exceptions[item['id']] = item
    return exceptions


def verified_runtime_exceptions(template, metadata, review_file):
    """Read explicitly reviewed differences between source-mask and path rasters."""
    if not review_file.exists():
        return {}
    review = json.loads(review_file.read_text(encoding='utf-8'))
    if review.get('schemaVersion') != 1 or review.get('measurementMethod') != 'OpenCV DIST_L2 DIST_MASK_PRECISE':
        raise ValueError('Unknown independent runtime width review format')
    items = [item for item in review['regions'] if item['templateId'] == template['id']]
    if not items:
        return {}
    source_dir = ROOT / 'content/generated-lineart/compiled' / template['id']
    source_qa = json.loads((source_dir / 'qa.json').read_text(encoding='utf-8'))
    exceptions = {}
    for item in items:
        filename = item.get('evidenceSnapshot', '')
        if not re.fullmatch(r'interaction-[a-f0-9]{64}\.json', filename):
            raise ValueError('Runtime width review needs an immutable operation snapshot')
        evidence_bytes = (review_file.parent / 'runtime-distance-evidence' / filename).read_bytes()
        evidence = json.loads(evidence_bytes)
        region = next((r for r in template['regions'] if r['id'] == item['id']), {})
        proof = next((r for r in evidence['regions'] if r['id'] == item['id']), {})
        source_metric = next((r for r in source_qa['regions'] if r['id'] == item['id']), {})
        jitter = proof.get('jitter', [])
        if (item['originalSha256'] != source_qa['originalSha256'] or
                item['originalSha256'] != evidence['originalSha256'] or evidence['templateId'] != template['id'] or
                item['pathSha256'] != digest(region.get('path', '').encode('utf-8')) or proof.get('pathSha256') != item['pathSha256'] or
                item['idRasterSha256'] != metadata['pngSha256'] or digest(evidence_bytes) != item['evidenceSha256'] or
                source_metric.get('usableDiameter') != item['sourceMaskDiameter'] or item['sourceMaskDiameter'] < 17 or
                not all(proof.get(key) is True for key in ('hitAtZoom4', 'painted', 'erased')) or
                {j.get('radiusCssPx') for j in jitter} != {4, 8} or
                not all(j.get('samples') == 8 and j.get('assistedTargetHits') == 8 and not j.get('conflicts') and j.get('misses') == 0 for j in jitter) or
                not item.get('reason') or not item.get('limitations') or not 0 < item['exactDiameter'] < 24 or
                (item['exactDiameter'] < 17 and item.get('allowBelowSelectionGuide') is not True)):
            raise ValueError('Runtime width review does not match the source, exact mask, and operation evidence')
        exceptions[item['id']] = {**item, 'runtimeExactDiameter': item['exactDiameter']}
    return exceptions


def audit_mask(template, png_bytes, metadata, exceptions=None):
    labels, scale = decode_regions(png_bytes, metadata, template)
    items, errors, warnings = [], [], []
    exceptions = exceptions or {}
    for index, region in enumerate(template['regions']):
        mask = np.where(labels == index + 1, 255, 0).astype(np.uint8)
        distance = cv2.distanceTransform(mask, cv2.DIST_L2, cv2.DIST_MASK_PRECISE)
        width = float(np.max(distance) * 2 * scale)
        area = int(np.count_nonzero(mask)) * scale * scale
        _, _, stats, _ = cv2.connectedComponentsWithStats(mask)
        substantial = sum(int(s[cv2.CC_STAT_AREA]) * scale * scale >= 240 for s in stats[1:])
        exception = exceptions.get(region['id'], {})
        exact = exception.get('runtimeExactDiameter')
        bound_exact = exact is not None and abs(width - exact) <= .005
        if exact is not None and not bound_exact:
            errors.append(f'{region["id"]}: current exact width does not match the individually reviewed measurement')
        waived = width < 24 and bool(exception) and (exact is None or bound_exact) and (
            width >= 17 or (bound_exact and exception.get('allowBelowSelectionGuide') is True))
        if width < 24:
            message = f'{region["id"]} {region["name"]}: maximum usable width {width:.2f}px < 24px'
            (warnings if waived else errors).append(message + ('; individually verified 4x operation exception' if waived else ''))
        if area < 240:
            errors.append(f'{region["id"]}: visible area {area:g}px² < 240px²')
        items.append({'id': region['id'], 'visibleArea': area, 'maxInscribedDiameter': round(width, 2),
                      'visibleComponents': substantial, 'widthExceptionApplied': waived})
    return {'templateId': template['id'], 'pass': not errors, 'errors': errors, 'warnings': warnings,
            'encoding': metadata['encoding'], 'rasterSize': metadata['rasterSize'], 'logicalScale': scale,
            'templateHash': metadata['templateHash'], 'pngSha256': metadata['pngSha256'], 'regions': items}


def main():
    output = ROOT / 'tools' / 'asset-pipeline' / 'output'
    reports = []
    for file in sorted((ROOT / 'content' / 'templates').glob('*.json')):
        template = json.loads(file.read_text(encoding='utf-8'))
        directory = output / template['id']
        try:
            metadata = json.loads((directory / 'analysis-region-ids.json').read_text(encoding='utf-8'))
            exceptions = verified_width_exceptions(template, ROOT / 'content/generated-lineart/compiled' / template['id'])
            exceptions.update(verified_runtime_exceptions(template, metadata, ROOT / 'content/generated-lineart/runtime-distance-review.json'))
            reports.append(audit_mask(template, (directory / 'analysis-region-ids.png').read_bytes(), metadata, exceptions))
        except (OSError, ValueError, KeyError, StopIteration) as error:
            reports.append({'templateId': template['id'], 'pass': False, 'errors': [str(error)], 'regions': []})
    review_file = ROOT / 'content/generated-lineart/runtime-distance-review.json'
    result = {'pass': bool(reports) and all(r['pass'] for r in reports),
              'method': 'OpenCV DIST_L2 DIST_MASK_PRECISE of exact declared RGB palette; actual raster-to-logical scale; hash-bound individual width exceptions',
              'runtimeDistanceReviewSha256': digest(review_file.read_bytes()) if review_file.exists() else None,
              'reports': reports}
    (output / 'native-distance-qa.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'pass': result['pass'], 'templates': len(reports), 'regions': sum(len(r['regions']) for r in reports),
                      'widthExceptionsApplied': sum(r.get('widthExceptionApplied', False) for report in reports for r in report['regions']),
                      'errors': [e for r in reports for e in r['errors']]}, ensure_ascii=False, indent=2))
    return 0 if result['pass'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
