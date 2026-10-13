"""Compile latest generated originals as unapproved evidence; never publish or approve."""
import argparse
import json
from pathlib import Path
import re

from compile_raster import compile_image

ROOT = Path(__file__).resolve().parents[2]
SUBJECTS = [
    ('princess', 'princess-bunny', 'おひめさまと うさぎ', 30, 35),
    ('magic', 'wizard-lantern', 'まほうつかいと ランタン', 25, 30),
    ('animals', 'tree-friends', 'きのしたの なかまたち', 20, 25),
    ('ocean', 'ocean-friends', 'うみの なかまたち', 22, 28),
    ('dinosaurs', 'dinosaur-eggs', 'きょうりゅうと たまご', 20, 25),
    ('vehicles', 'round-sports-car', 'まるい スポーツカー', 25, 30),
    ('construction', 'excavator-cones', 'ショベルカーと コーン', 30, 35),
    ('robots', 'explorer-robot', 'たんけん ロボット', 30, 40),
    ('space', 'rocket-astronaut', 'ロケットと うちゅうひこうし', 25, 30),
    ('flowers', 'bouquet-butterfly', 'はなたばと ちょうちょ', 30, 40),
]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--themes', nargs='+', choices=[item[0] for item in SUBJECTS])
    parser.add_argument('--advisory-count', action='store_true')
    parser.add_argument('--preserve-evidence', action='store_true', help='技術注釈のみの更新では保持済みの固定操作証拠を再利用する')
    options = parser.parse_args()
    reports = []
    for theme, subject, title, lower, upper in SUBJECTS:
        if options.themes and theme not in options.themes:
            continue
        originals = list((ROOT / 'content/generated-lineart/originals').glob(f'{theme}-v*.png'))
        originals = [file for file in originals if re.fullmatch(f'{theme}-v[0-9]+.png', file.name)]
        if not originals:
            reports.append({'themeId': theme, 'pass': False, 'errors': ['原画像がまだありません']})
            continue
        source = max(originals, key=lambda file: int(re.search(r'-v(\d+)\.png$', file.name)[1]))
        version = re.search(r'-v(\d+)\.png$', source.name)[1]
        template_id = f'gen-{subject}-v{version}'
        annotation = ROOT / 'content/generated-lineart/annotations' / f'{template_id}.json'
        report = compile_image(source, ROOT / 'tools/asset-pipeline/output' / template_id,
                               template_id, theme, title, lower, upper, fit_safe_page=True,
                               advisory_count=options.advisory_count,
                               annotations=annotation if annotation.exists() else None,
                               evidence_source=ROOT / 'content/generated-lineart/compiled' / template_id if options.preserve_evidence else None)
        compact = {key: report[key] for key in ('templateId', 'pass', 'regionCount', 'expectedRange', 'countPolicy',
                                               'tinyRegions', 'largeGapCandidates', 'minimumUsableDiameter',
                                               'materialReviewRequired', 'errors', 'warnings')}
        compact['themeId'] = theme
        compact['source'] = source.relative_to(ROOT).as_posix()
        compact['evidenceDirectory'] = f'tools/asset-pipeline/output/{template_id}'
        reports.append(compact)
        print(json.dumps(compact, ensure_ascii=False))
    summary = {'pass': bool(reports) and all(report['pass'] for report in reports),
               'expectedTotal': 10, 'testedCount': len(reports), 'humanApproved': False, 'reports': reports}
    destination = ROOT / 'content/generated-lineart' / ('qa-latest.json' if not options.themes else 'qa-selected.json')
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding='utf-8')
    return 0 if summary['pass'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
