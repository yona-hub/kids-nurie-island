"""Trace actual clipped source ink; no generation or original-file edits."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / '.local' / 'python-packages'))
import cv2
import numpy as np
from compile_raster import path_from_mask

spec = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
result = []
for item in spec:
    pixels = cv2.imdecode(np.frombuffer(Path(item['file']).read_bytes(), np.uint8), cv2.IMREAD_UNCHANGED)
    alpha = pixels[:, :, 3] if pixels.ndim == 3 and pixels.shape[2] == 4 else pixels[:, :, 0]
    mask = np.where(alpha >= 128, 255, 0).astype(np.uint8)
    if item.get('protectSilhouette'):
        # A source eye can meet the silhouette (turtle/dinosaur). Reclaiming its
        # old rim must not cut the exterior and merge a face with the background.
        protection = item['protectSilhouette']
        def alpha_mask(filename):
            image = cv2.imdecode(np.frombuffer(Path(filename).read_bytes(), np.uint8), cv2.IMREAD_UNCHANGED)
            return np.where(image[:, :, 3] >= 128, 255, 0).astype(np.uint8)
        silhouette = alpha_mask(protection['opaque'])
        # Only the EXTERIOR silhouette is protected. Tiny alpha gaps around an
        # internal eye must not be mistaken for exterior boundaries and restore
        # the obsolete eye ring we just removed.
        exterior_contours, _ = cv2.findContours(silhouette, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        silhouette = np.zeros_like(silhouette)
        cv2.drawContours(silhouette, exterior_contours, -1, 255, cv2.FILLED)
        original_ink = alpha_mask(protection['ink'])
        radius = round(protection['width'] * item['scale'])
        interior = cv2.erode(silhouette, np.ones((radius*2+1, radius*2+1), np.uint8))
        mask = cv2.bitwise_or(mask, cv2.bitwise_and(original_ink, cv2.bitwise_not(interior)))
    if item.get('closeSeams'):
        # The foreground closes subpixel raster gaps. The shared ink graph also
        # closes source-sized pinholes, so the adopted semantic parts remain
        # separate; intentional open creases are larger and stay open.
        radius = round(item['closeSeams'] * item['scale'])
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((radius*2+1, radius*2+1), np.uint8))
    path, _ = path_from_mask(mask, 1 / item['scale'], 1 / item['scale'], epsilon=.45)
    # Keep the nested boundary graph. Each white component uses the very same
    # contour as the adjacent black ink, instead of fitting a second raster.
    contours, hierarchy = cv2.findContours(mask, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    boundaries = []
    for index, contour in enumerate(contours):
        points = cv2.approxPolyDP(contour, .45, True)[:, 0]
        if len(points) < 3:
            raise ValueError(f'Degenerate production contour {index}')
        parent = int(hierarchy[0, index, 3])
        depth, ancestor = 0, parent
        while ancestor >= 0:
            depth += 1
            ancestor = int(hierarchy[0, ancestor, 3])
        boundary = 'M ' + ' L '.join(f'{float(x/item["scale"]):.2f} {float(y/item["scale"]):.2f}' for x, y in points) + ' Z'
        boundaries.append({'index': index, 'parent': parent, 'depth': depth, 'path': boundary})
    result.append({'path': path, 'boundaries': boundaries, 'x': item['x'], 'y': item['y']})
Path(sys.argv[2]).write_text(json.dumps(result), encoding='utf-8')
