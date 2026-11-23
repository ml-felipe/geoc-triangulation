# Incremental triangulation with a DCEL

Recovered UPC-FIB Computational Geometry Labs 4–5. The JavaScript implementation inserts points into a triangle subdivision, splits edges when an inserted point lies on an edge, and flips edges using an in-circle test. A separate boundary-pruning pass filters the result.

## Run

No JavaScript packages are required. With Node.js installed, run `make test` (or `node tests/test.js`). For the recovered canvas demo, run `make serve` with Python 3 and open <http://localhost:8000/demo/>. It uses the included ten-point toy dataset. Triangulation can be run repeatedly, and boundary drawing/pruning remain available. The original external pan/zoom and 3D dependencies are omitted.

`src/triangulation.js` preserves the original browser API. `computeTriangulation(points)` **mutates** the input array by prepending three enclosing vertices; returned triangle indices refer to that mutated array. The demo clones its input before every run. Exact duplicate coordinates are skipped, and nonfinite coordinates are rejected.

## Verification and repairs

The Node regression suite passed 57 point sets: the recovered toy data, directed edge/duplicate/collinear cases, and 50 deterministic random sets. It checks twin symmetry, next-edge endpoints, triangular face loops, face and vertex representatives, Euler's relation, edge incidence, convex-hull area coverage, and empty circumcircles. Topology is checked after insertion, splitting and flipping; the suite exercised 1,272 insertions, 3 edge splits and 2,545 flips.

Migration fixes repair outgoing vertex references after flips and face representatives after edge splits; exclude the enclosing triangle from output; handle duplicate indices; and prevent point location from entering the exterior face or using stale faces after legalization. A larger enclosing triangle fixes a hull-coverage failure reproduced by the tests. The demo now keeps dataset boundary indices aligned after triangulation.

## Limits

Predicates use JavaScript floating-point arithmetic, not adaptive exact predicates. The enclosing triangle uses a finite margin (1,024 times the input span); this is a practical repair for the tested data, not a proof for all inputs. Extreme scales and nearly collinear/cocircular data remain numerical risks. Boundary pruning is not constrained Delaunay triangulation: it does not insert polygon edges. Tests are regression evidence, not exhaustive geometric verification. The original large terrain datasets are not included.

See [ATTRIBUTION.md](ATTRIBUTION.md) before publication.
