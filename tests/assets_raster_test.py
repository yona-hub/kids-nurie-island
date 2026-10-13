"""Meaningful raster regressions: intact loops, minor repairs, major leaks, original integrity."""
import importlib.util
import copy
import hashlib
import json
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('compile_raster', ROOT / 'tools/asset-pipeline/compile_raster.py')
pipeline = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pipeline)
np, cv2 = pipeline.np, pipeline.cv2


class AssetRasterTests(unittest.TestCase):
    def art(self):
        image = np.full((2000, 1600), 255, np.uint8)
        cv2.rectangle(image, (300, 400), (700, 900), 0, 12)
        cv2.circle(image, (1100, 1200), 220, 0, 12)
        return image

    def compile(self, image, **options):
        base = (ROOT / '.local' / 'asset-tests').resolve()
        base.mkdir(parents=True, exist_ok=True)
        temporary = tempfile.TemporaryDirectory(prefix='nurie-raster-', dir=base)
        directory = Path(temporary.name)
        self.assertTrue(directory.resolve().is_relative_to(base))
        self.addCleanup(temporary.cleanup)
        source = directory / 'drawing.png'
        pipeline.write_image(source, image)
        original_bytes = source.read_bytes()
        out = directory / 'compiled'
        annotations = options.pop('annotation_data', None)
        if annotations:
            annotations['originalSha256'] = hashlib.sha256(source.read_bytes()).hexdigest()
            annotation_file = directory / 'review.json'
            annotation_file.write_text(json.dumps(annotations, ensure_ascii=False), encoding='utf-8')
            options['annotations'] = annotation_file
        result = pipeline.compile_image(source, out, 'test-drawing', 'animals', '確認用原画', 2, 2, **options)
        self.assertEqual(original_bytes, source.read_bytes())
        self.assertEqual(original_bytes, (out / 'original.png').read_bytes())
        package = json.loads((out / 'template.json').read_text(encoding='utf-8'))
        self.assertFalse(package['approved'])
        self.assertTrue(package['details'][0]['path'].endswith('Z'))
        self.assertEqual(package['lineWidth'], 0)
        self.assertEqual(package['details'][0]['strokeWidth'], 0)
        self.assertEqual(result['templateSha256'], hashlib.sha256((out / 'template.json').read_bytes()).hexdigest())
        return result, package

    def test_closed_shapes_compile_without_background(self):
        result, package = self.compile(self.art())
        self.assertTrue(result['pass'], result['errors'])
        self.assertEqual(result['regionCount'], 2)
        self.assertEqual(result['backgroundComponentsExcluded'], 1)
        self.assertTrue(all(r['path'].endswith('Z') for r in package['regions']))
        self.assertTrue(all(r['material'] == 'standard' and r['confidence'] == .25 for r in package['regions']))

    def test_two_pixel_gap_is_only_repaired_in_analysis_mask(self):
        image = self.art()
        image[390:411, 490:492] = 255
        result, _ = self.compile(image)
        self.assertTrue(result['pass'], result['errors'])
        self.assertEqual(result['smallRepairCandidates'], 1)
        self.assertEqual(result['largeGapCandidates'], 0)

    def test_eight_pixel_gap_is_rejected_not_silently_repaired(self):
        image = self.art()
        image[390:411, 490:498] = 255
        result, _ = self.compile(image)
        self.assertFalse(result['pass'])
        self.assertEqual(result['regionCount'], 1)
        self.assertGreater(result['largeGapCandidates'], 0)

    def test_tiny_closed_shape_requires_correction(self):
        image = self.art()
        cv2.circle(image, (950, 450), 13, 0, 10)
        result, _ = self.compile(image)
        self.assertFalse(result['pass'])
        self.assertGreater(result['tinyRegions'], 0)

    def test_page_fit_preserves_original_and_handles_generation_rounding(self):
        image = cv2.resize(self.art(), (1122, 1402))
        result, _ = self.compile(image, fit_safe_page=True)
        self.assertTrue(result['pass'], result['errors'])
        self.assertEqual(result['originalSize'], [1122, 1402])
        self.assertEqual(result['analysisSize'], [1600, 2000])
        self.assertFalse(result['normalization']['cropped'])
        self.assertFalse(result['normalization']['contoursRedrawn'])

    def test_fit_cannot_disguise_low_resolution_input(self):
        result, _ = self.compile(cv2.resize(self.art(), (400, 500)), fit_safe_page=True)
        self.assertFalse(result['pass'])
        self.assertTrue(any('解像度' in error for error in result['errors']))

    def test_background_exclusion_requires_explicit_bound_annotation(self):
        image = self.art()
        cv2.rectangle(image, (850, 300), (1250, 550), 0, 12)
        data = {'coordinateSpace': 'normalized-1600x2000', 'reviewer': '技術テスト',
                'regions': [{'point': [1000, 400], 'role': 'background', 'name': '確認用の背景空間',
                             'reason': '二つの主役の間に囲まれた背景として明示指定'}]}
        result, package = self.compile(image, annotation_data=data)
        self.assertTrue(result['pass'], result['errors'])
        self.assertEqual(result['detectedRegionCount'], 3)
        self.assertEqual(result['regionCount'], 2)
        self.assertEqual(len(result['excludedBackgroundRegions']), 1)
        self.assertTrue(result['annotationSha256'])
        self.assertEqual(len(package['regions']), 2)

    def test_advisory_count_never_waives_narrow_regions(self):
        image = self.art()
        cv2.rectangle(image, (900, 350), (1200, 378), 0, 12)
        result, _ = self.compile(image, advisory_count=True)
        self.assertEqual(result['countPolicy'], 'advisory')
        self.assertFalse(result['countWithinExpectedRange'])
        self.assertTrue(any('領域数' in warning for warning in result['warnings']))
        self.assertFalse(result['pass'])
        self.assertTrue(any('幅24px' in error for error in result['errors']))

    def test_gap_decision_requires_the_current_source_point_and_parent(self):
        image = self.art()
        cv2.rectangle(image, (400, 520), (600, 700), 0, 12)
        image[510:531, 490:498] = 255
        annotations = {'coordinateSpace': 'normalized-1600x2000', 'reviewer': '技術テスト',
                       'regions': [{'point': [350, 450], 'role': 'paint', 'name': '長方形',
                                    'reason': '大きな閉領域の中に開いた装飾線がある'}]}
        first, _ = self.compile(image, annotation_data=copy.deepcopy(annotations))
        self.assertFalse(first['pass'])
        self.assertEqual(first['unreviewedLargeGapCandidates'], 1)
        candidate = first['gapCandidateDetails'][0]
        review = {key: candidate[key] for key in ('candidateKey', 'originalSha256', 'kind',
                  'parentRegionId', 'parentRegionName', 'parentExteriorConnected')}
        review.update(point=candidate['labelPoint'], classification='intentional-open-detail',
                      part='長方形内の開いた装飾線', reason='同じ長方形へつながり外背景にはつながらない')
        annotations['gapReviews'] = [review]
        valid, _ = self.compile(image, annotation_data=copy.deepcopy(annotations))
        self.assertTrue(valid['pass'], valid['errors'])
        for key, value in [('point', [1100, 1200]), ('parentRegionId', 'r99'), ('originalSha256', '0' * 64)]:
            with self.subTest(key=key):
                wrong = copy.deepcopy(annotations)
                wrong['gapReviews'][0][key] = value
                result, _ = self.compile(image, annotation_data=wrong)
                self.assertFalse(result['pass'])
                self.assertEqual(result['unreviewedLargeGapCandidates'], 1)


if __name__ == '__main__':
    unittest.main(verbosity=2)
