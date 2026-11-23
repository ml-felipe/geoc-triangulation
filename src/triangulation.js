class vertex_table {
	constructor() {
		//The index represents the vertex ID
		this.edgeIndex = [];
	}
}

class face_table {
	constructor() {
		//The index represents the face ID
		this.edgeIndex = [];
	}
}

class DCEL {
	constructor() {
		//The index represents the edge ID
		this.vertexBegin = [];
		this.faceRight = [];
		this.edgeNext = [];
		this.twinEdge = [];
		this.vertexTable;
		this.faceTable;
	}

	// Initialize DCEL with enclosing triangle
	init() {
        // Create vertex table
        this.vertexTable = new vertex_table();

        // Create face table
        this.faceTable = new face_table();
        this.faceTable.edgeIndex.push(0); // Face 0 (inner)
        this.faceTable.edgeIndex.push(1); // Face 1 (outer)
        
        // Add vertex pointers
        this.vertexTable.edgeIndex.push(0); // v0
        this.vertexTable.edgeIndex.push(2); // v1
        this.vertexTable.edgeIndex.push(4); // v2

        // e0 (v0 -> v1)
        this.vertexBegin.push(0);
        this.faceRight.push(0);
        this.edgeNext.push(2);
        this.twinEdge.push(1);

        // e1 (v1 -> v0)
        this.vertexBegin.push(1);
        this.faceRight.push(1);
        this.edgeNext.push(5);
        this.twinEdge.push(0);

        // e2 (v1 -> v2)
        this.vertexBegin.push(1);
        this.faceRight.push(0);
        this.edgeNext.push(4);
        this.twinEdge.push(3);

        // e3 (v2 -> v1)
        this.vertexBegin.push(2);
        this.faceRight.push(1);
        this.edgeNext.push(1);
        this.twinEdge.push(2);

        // e4 (v2 -> v0)
        this.vertexBegin.push(2);
        this.faceRight.push(0);
        this.edgeNext.push(0);
        this.twinEdge.push(5);

        // e5 (v0 -> v2)
        this.vertexBegin.push(0);
        this.faceRight.push(1);
        this.edgeNext.push(3);
        this.twinEdge.push(4);
    }

	insert(point_index, face) {
        // Get face edges (e0, e1, e2)
        var e0 = this.faceTable.edgeIndex[face];
        if (this.faceRight[e0] !== face) e0 = this.twinEdge[e0];
        var e1 = this.edgeNext[e0];
        var e2 = this.edgeNext[e1];
        var e = [e0, e1, e2];
        
        // Get face vertices (v0, v1, v2)
        var v0 = this.vertexBegin[e[0]];
        var v1 = this.vertexBegin[e[1]];
        var v2 = this.vertexBegin[e[2]];
        var v = [v0, v1, v2];

        // n0: P -> v0  (twin n1: v0 -> P)
        // n2: P -> v1  (twin n3: v1 -> P)
        // n4: P -> v2  (twin n5: v2 -> P)

        var n = [];
        var length = this.edgeNext.length;
        for (let i = 0; i < 6; i++) {
            n.push(length + i);
        }

        var f1 = this.faceTable.edgeIndex.length;
        var f2 = this.faceTable.edgeIndex.length + 1;
        
        // n0 (P -> v0)
        this.vertexBegin.push(point_index);
        this.faceRight.push(face); 
        this.edgeNext.push(e[0]);  
        this.twinEdge.push(n[1]);
        
        // n1 (v0 -> P)
        this.vertexBegin.push(v[0]); //
        this.faceRight.push(f2); 
        this.edgeNext.push(n[4]);  
        this.twinEdge.push(n[0]);

        // n2 (P -> v1)
        this.vertexBegin.push(point_index);
        this.faceRight.push(f1); 
        this.edgeNext.push(e[1]);  
        this.twinEdge.push(n[3]);
        
        // n3 (v1 -> P)
        this.vertexBegin.push(v[1]);
        this.faceRight.push(face); 
        this.edgeNext.push(n[0]);  
        this.twinEdge.push(n[2]);
        
        // n4 (P -> v2)
        this.vertexBegin.push(point_index);
        this.faceRight.push(f2); 
        this.edgeNext.push(e[2]);  
        this.twinEdge.push(n[5]);
        
        // n5 (v2 -> P)
        this.vertexBegin.push(v[2]);
        this.faceRight.push(f1); 
        this.edgeNext.push(n[2]);  
        this.twinEdge.push(n[4]);

        // Update old edge pointers
        this.faceRight[e[0]] = face;
        this.faceRight[e[1]] = f1;
        this.faceRight[e[2]] = f2;
        
        this.edgeNext[e[0]] = n[3]; 
        this.edgeNext[e[1]] = n[5]; 
        this.edgeNext[e[2]] = n[1]; 

        // Update tables
        this.faceTable.edgeIndex[face] = e[0];
        this.faceTable.edgeIndex.push(e[1]); // New face f1
        this.faceTable.edgeIndex.push(e[2]); // New face f2

        this.vertexTable.edgeIndex[point_index] = n[0]; // Add edge from the new vertex

		// Added for Delaunay check
		return [e[0], e[1], e[2]];
    }

    splitEdge(point_index, e_idx) {
        var e = e_idx; 
        var eT = this.twinEdge[e];
        
        var f1 = this.faceRight[e];
        var f2 = this.faceRight[eT];
        
        // Edges of Face 1: e -> e1_next -> e1_prev
        var e1_next = this.edgeNext[e];
        var e1_prev = this.edgeNext[e1_next];
        
        // Edges of Face 2: eT -> e2_next -> e2_prev
        var e2_next = this.edgeNext[eT];
        var e2_prev = this.edgeNext[e2_next];
        
        // Vertices
        var v_o1 = this.vertexBegin[e1_prev]; 
        var v_o2 = this.vertexBegin[e2_prev]; 
        
        // Allocate 6 new edge slots
        // n0, n1: The second halves of the split edges e and eT
        // n2, n3: The new cross edge in f1 (P <-> v_o1)
        // n4, n5: The new cross edge in f2 (P <-> v_o2)
        
        var base = this.edgeNext.length;
        var n0 = base, n1 = base+1, n2 = base+2, n3 = base+3, n4 = base+4, n5 = base+5;
        
        // Initialize arrays for new edges
        for(let k=0; k<6; k++) {
            this.edgeNext.push(0);
            this.vertexBegin.push(0);
            this.faceRight.push(0);
            this.twinEdge.push(0);
        }

        // New Faces (Reuse f1, f2 for the others)
        var f3 = this.faceTable.edgeIndex.length;
        this.faceTable.edgeIndex.push(n0);
        var f4 = this.faceTable.edgeIndex.length;
        this.faceTable.edgeIndex.push(n1);


        // n0: P -> v_end (Continuation of e)
        this.vertexBegin[n0] = point_index;
        this.faceRight[n0] = f3;
        this.edgeNext[n0] = e1_next;
        this.twinEdge[n0] = eT;

        // n1: P -> v_start (Continuation of eT)
        this.vertexBegin[n1] = point_index;
        this.faceRight[n1] = f4;
        this.edgeNext[n1] = e2_next;
        this.twinEdge[n1] = e;

        // n2: P -> v_o1 (Cross edge in f1)
        this.vertexBegin[n2] = point_index;
        this.faceRight[n2] = f1;
        this.edgeNext[n2] = e1_prev;
        this.twinEdge[n2] = n3;

        // n3: v_o1 -> P (Cross edge in f1)
        this.vertexBegin[n3] = v_o1;
        this.faceRight[n3] = f3;
        this.edgeNext[n3] = n0;
        this.twinEdge[n3] = n2;

        // n4: P -> v_o2 (Cross edge in f2)
        this.vertexBegin[n4] = point_index;
        this.faceRight[n4] = f2;
        this.edgeNext[n4] = e2_prev;
        this.twinEdge[n4] = n5;

        // n5: v_o2 -> P (Cross edge in f2)
        this.vertexBegin[n5] = v_o2;
        this.faceRight[n5] = f4;
        this.edgeNext[n5] = n1;
        this.twinEdge[n5] = n4;

        // e: u -> P (Reduced from u -> v)
        this.edgeNext[e] = n2;
        this.twinEdge[e] = n1; 
        // faceRight[e] remains f1

        // eT: v -> P (Reduced from v -> u)
        this.edgeNext[eT] = n4;
        this.twinEdge[eT] = n0;
        // faceRight[eT] remains f2

        // Update previous edges to point to new structure
        this.faceRight[e1_prev] = f1;
        this.edgeNext[e1_prev] = e;

        this.faceRight[e1_next] = f3;
        this.edgeNext[e1_next] = n3;

        this.faceRight[e2_prev] = f2;
        this.edgeNext[e2_prev] = eT;

        this.faceRight[e2_next] = f4;
        this.edgeNext[e2_next] = n5;

        this.faceTable.edgeIndex[f1] = e;
        this.faceTable.edgeIndex[f2] = eT;
        this.vertexTable.edgeIndex[point_index] = n0;

		// Added for Delaunay check
		return [e1_next, e1_prev, e2_next, e2_prev];
    }

	flipEdge(e_idx) {
        // e is the edge to flip (u -> v)
        var e = e_idx;
        var eT = this.twinEdge[e];

        var f1 = this.faceRight[e];
        var f2 = this.faceRight[eT];

        // Edges in f1 (CCW): e -> e1 -> e2
        var e1 = this.edgeNext[e];
        var e2 = this.edgeNext[e1];

        // Edges in f2 (CCW): eT -> eT1 -> eT2
        var eT1 = this.edgeNext[eT];
        var eT2 = this.edgeNext[eT1];

        // Vertices
        var v = this.vertexBegin[e]; // v (origin of e)
        var u = this.vertexBegin[eT]; // u (origin of eT)
        var o1 = this.vertexBegin[e2]; // opposite in f1
        var o2 = this.vertexBegin[eT2]; // opposite in f2

        // e becomes o2 -> o1
        this.vertexBegin[e] = o2;
        this.edgeNext[e] = e2;
        
        // eT becomes o1 -> o2
        this.vertexBegin[eT] = o1;
        this.edgeNext[eT] = eT2;

        // Face 1 is now (o2, o1, u) -> edges: e, e2, eT1
        this.edgeNext[e2] = eT1;
        this.edgeNext[eT1] = e;
        this.faceRight[eT1] = f1; // eT1 moved to f1

        // Face 2 is now (o1, o2, v) -> edges: eT, eT2, e1
        this.edgeNext[eT2] = e1;
        this.edgeNext[e1] = eT;
        this.faceRight[e1] = f2; // e1 moved to f2

        this.faceTable.edgeIndex[f1] = e;
        this.faceTable.edgeIndex[f2] = eT;

        if(this.vertexTable.edgeIndex[v] === e) this.vertexTable.edgeIndex[v] = eT1;
        if(this.vertexTable.edgeIndex[u] === eT) this.vertexTable.edgeIndex[u] = e1;
    }

	// 'p_idx' is the index of the newly inserted point
    // 'e_idx' is the edge being checked
    checkEdge(points, p_idx, e_idx) {
        var eT = this.twinEdge[e_idx];
        var f_adj = this.faceRight[eT];
        
        // Stop if the adjacent face is the outer boundary
        if(f_adj === 1) return;

        // Edge e is u -> v
        var u_idx = this.vertexBegin[e_idx];
        var v_idx = this.vertexBegin[this.edgeNext[e_idx]];

        // Find the third vertex 'q' in the adjacent triangle
        var eT_next = this.edgeNext[eT];
        var eT_prev = this.edgeNext[eT_next];
        var q_idx = this.vertexBegin[eT_prev]; 

        // Check if q is inside the circumcircle of triangle (u, v, p)
        if (inCircle(points[u_idx], points[v_idx], points[p_idx], points[q_idx])) {
            
            this.flipEdge(e_idx);
            this.checkEdge(points, p_idx, eT_next); // Recursively check u->q
            this.checkEdge(points, p_idx, eT_prev); // Recursively check q->v
        }
    }

	updateP(p, points) {
        var f_orig = p.currentFace;
        // The last two faces added are always new
        var f_new1 = this.faceTable.edgeIndex.length - 1;
        var f_new2 = this.faceTable.edgeIndex.length - 2;

        var candidates = [f_orig, f_new1, f_new2];
        for (let face of candidates) {
            if (face !== 1 && this.pointInFace(points, p, face).type !== 0) return face;
        }

        console.log("updateP: Fast check failed, scanning all faces...");
        
        for (let f = 0; f < this.faceTable.edgeIndex.length; f++) {
            if (f === 1) continue; // Skip outer face
            let result = this.pointInFace(points, p, f);
            if (result.type !== 0) { 
                return f; 
            }
        }

        console.log("CRITICAL ERROR: Auxiliary point 'p' is outside the triangulation.");
        return 0; // Absolute fallback
    }

	pointInFace(points, point, face) {
		//Get face edges
		var e0 = this.faceTable.edgeIndex[face];
		if(this.faceRight[e0] !== face) e0 = this.twinEdge[e0];
		var e1 = this.edgeNext[e0];
		var e2 = this.edgeNext[e1];
		var e = [e0, e1, e2];
		
		var o = [0, 0, 0];
		for(let i = 0; i < 3; i++) o[i] = checkOrientation(point, points[this.vertexBegin[e[i]]], points[this.vertexBegin[e[(i+1)%3]]]);
		
		// Check for degeneracy
        if (o[0] === 0 && onSegment(point, points[this.vertexBegin[e[0]]], points[this.vertexBegin[e[1]]])) {
            return { type: 2, edge: e[0] };
        }
        if (o[1] === 0 && onSegment(point, points[this.vertexBegin[e[1]]], points[this.vertexBegin[e[2]]])) {
            return { type: 2, edge: e[1] };
        }
        if (o[2] === 0 && onSegment(point, points[this.vertexBegin[e[2]]], points[this.vertexBegin[e[0]]])) {
            return { type: 2, edge: e[2] };
        }

        // Standard cases
        if (sameSign(o[0], o[1], o[2])) return { type: 1 }; // Inside
        return { type: 0 }; // Outside
    }
}

function equalPoints(p, q) {
	return (p.x == q.x) && (p.y == q.y);
}

function sameSign(a, b, c) {
  return (a > 0 && b > 0 && c > 0) || (a < 0 && b < 0 && c < 0);
}

function onSegment(p, a, b) {
	// Assuming colinearity
    return  Math.min(a.x, b.x) <= p.x && p.x <= Math.max(a.x, b.x) &&
            Math.min(a.y, b.y) <= p.y && p.y <= Math.max(a.y, b.y);
}

function inCircle(a, b, c, d) {
    // a,b,c are CCW.
    var ax = a.x - d.x;
    var ay = a.y - d.y;
    var bx = b.x - d.x;
    var by = b.y - d.y;
    var cx = c.x - d.x;
    var cy = c.y - d.y;

    var val =  (ax*ax + ay*ay) * (bx*cy - cx*by) -
               (bx*bx + by*by) * (ax*cy - cx*ay) +
               (cx*cx + cy*cy) * (ax*by - bx*ay);

    return val > 0; // > 0 inside
}

function checkOrientation(p, a, b) {
	// COLINEAR = 0
	// LEFT = 1
	// RIGHT = -1
	var determinant = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
	if(determinant > 0) return 1;
	if(determinant < 0) return -1;
	return 0;
}

function checkIntersection(s1, s2) {
	var p1 = s1.from, p2 = s1.to;
	var p3 = s2.from, p4 = s2.to;

	var d1 = checkOrientation(p3, p1, p2);
	var d2 = checkOrientation(p4, p1, p2);
	var d3 = checkOrientation(p1, p3, p4);
	var d4 = checkOrientation(p2, p3, p4);

	if(d1 == 0 && d2 == 0 && d3 == 0 && d4 == 0) {
		var overlapX = Math.max(Math.min(p1.x,p2.x), Math.min(p3.x,p4.x)) <= Math.min(Math.max(p1.x,p2.x), Math.max(p3.x,p4.x));
		var overlapY = Math.max(Math.min(p1.y,p2.y), Math.min(p3.y,p4.y)) <= Math.min(Math.max(p1.y,p2.y), Math.max(p3.y,p4.y));
		if(!(overlapX && overlapY)) return 0; // No Overlap

		return 2; // Degenerate
	}

   if(equalPoints(p1, p3) || equalPoints(p1, p4) || equalPoints(p2, p3) || equalPoints(p2, p4)) return 1; // Overlap

    if((d1 == 0 && onSegment(p3, p1, p2)) ||
       (d2 == 0 && onSegment(p4, p1, p2)) ||
       (d3 == 0 && onSegment(p1, p3, p4)) ||
       (d4 == 0 && onSegment(p2, p3, p4))) return 1; // Overlap

	   if((d1 * d2 < 0) && (d3 * d4 < 0)) return 1; // Overlap

   	return 0; // No Overlap
}

function computeTriangulation(points) {
    if (points.length === 0) return [];
    if (points.some(p => !Number.isFinite(p.x) || !Number.isFinite(p.y)))
        throw new TypeError("Point coordinates must be finite");
    // Compute bounding box
    var minX = points[0].x, maxX = points[0].x;
    var minY = points[0].y, maxY = points[0].y;
    for (var i = 1; i < points.length; i++) {
        if (points[i].x < minX) minX = points[i].x;
        if (points[i].x > maxX) maxX = points[i].x;
        if (points[i].y < minY) minY = points[i].y;
        if (points[i].y > maxY) maxY = points[i].y;
    }

    // Keep synthetic vertices well outside ordinary input circumcircles.
    // This finite margin is not an exact-predicate robustness guarantee.
    var dX = 1024 * Math.max(maxX - minX, maxY - minY, 1);
    var dY = dX;
    var midx = (minX + maxX) / 2;
    var midy = (minY + maxY) / 2;

    // Create initial triangle
    var v0 = { x: minX - dX, y: minY - dY, z: 0 };
    var v1 = { x: maxX + dX, y: minY - dY, z: 0 };
    var v2 = { x: midx, y: maxY + dY, z: 0 };

    // Auxiliary point p (center)
    var p = { x: midx, y: midy, z: 0, currentFace: 0 };

    points.unshift(v2);
    points.unshift(v1);
    points.unshift(v0);

    var dcel = new DCEL();
    dcel.init();

    const seen = new Set();
    for(let i = 3; i < points.length; i++) {
        const key = `${points[i].x},${points[i].y}`;
        if (seen.has(key)) continue;
        seen.add(key);

        // Locate the face that contains point i
        var found = { type: 0 };
        var currentFace = p.currentFace;
        var previousFace = -1;
        
        var steps = 0; 
        var MAX_STEPS = points.length; // Threshold to force brute-force

        while (found.type === 0) {
            steps++;
            found = dcel.pointInFace(points, points[i], currentFace);
            
            if(found.type === 0) {
                // Move to adjacent face
                var edgeFound = false;
                if (steps < MAX_STEPS) {
                    var currentEdge = dcel.faceTable.edgeIndex[currentFace];
                    for(var j = 0; j < 3 && !edgeFound; j++) {
                        const s1 = { "from": points[dcel.vertexBegin[currentEdge]], "to": points[dcel.vertexBegin[dcel.edgeNext[currentEdge]]] };
                        const s2 = { "from": p, "to": points[i] };
                        
                        if(dcel.faceRight[dcel.twinEdge[currentEdge]] !== 1 && previousFace != dcel.faceRight[dcel.twinEdge[currentEdge]]) {
                            const intersectionCheck = checkIntersection(s1, s2);
                            if(intersectionCheck !== 0) {
                                previousFace = currentFace;
                                currentFace = dcel.faceRight[dcel.twinEdge[currentEdge]];
                                edgeFound = true;
                            }
                        }
                        if(!edgeFound) currentEdge = dcel.edgeNext[currentEdge];
                    }
                }
                if (!edgeFound) {
                    var foundInFallback = false;
                    for(let f = 0; f < dcel.faceTable.edgeIndex.length; f++) {
                        if(f === 1) continue; // Skip outer face
                        let pif = dcel.pointInFace(points, points[i], f);
                        
                        if(pif.type !== 0) { 
                            currentFace = f;
                            found = pif;    
                            foundInFallback = true;
                            break;
                        } 
                    }
                    if (!foundInFallback) {
                        throw new Error("Point location failed at index " + i);
                    }
                }
            }
        }
        if (found.type === 1) {
            var boundaryEdges = dcel.insert(i, currentFace);

        
            for(let edge of boundaryEdges) {
                dcel.checkEdge(points, i, edge);
            }
            p.currentFace = dcel.updateP(p, points);
        }
        else if (found.type === 2) {
            var boundaryEdges = dcel.splitEdge(i, found.edge);


            for(let edge of boundaryEdges) {
                dcel.checkEdge(points, i, edge);
            }
            p.currentFace = dcel.updateP(p, points);
		}
    }

    var triangleOutput = [];
    for(let f = 0; f < dcel.faceTable.edgeIndex.length; f++) {
        //Get face edges
        var e0 = dcel.faceTable.edgeIndex[f];
        if(dcel.faceRight[e0] !== f) e0 = dcel.twinEdge[e0];
        var e1 = dcel.edgeNext[e0];
        var e2 = dcel.edgeNext[e1];

        //Get face vertices
        var v0 = dcel.vertexBegin[e0];
        var v1 = dcel.vertexBegin[e1];
        var v2 = dcel.vertexBegin[e2];
        if (f !== 1 && v0 >= 3 && v1 >= 3 && v2 >= 3)
            triangleOutput.push([v0, v1, v2]);
    }
    return triangleOutput;
}

function pruneTriangulation(triangles, points, boundaries) {
    if (!boundaries) return triangles;

    var validTriangles = [];
    for(var i = 0; i < triangles.length; i++) {
        // Check if the center of the triangle is inside a boundary
        if (isTriangleValid(triangles[i], points, boundaries)) {
            validTriangles.push(triangles[i]);
        }
    }
    return validTriangles;
}

function isTriangleValid(t, points, boundaries) {
    // Calculate Centroid
    var v0 = points[t[0]];
    var v1 = points[t[1]];
    var v2 = points[t[2]];
    var center = { x: (v0.x + v1.x + v2.x)/3, y: (v0.y + v1.y + v2.y)/3 };

    // Check if centroid is inside ANY island
    for(var k = 0; k < boundaries.length; k++) {
        if(isPointInPoly(center, boundaries[k], points)) {
            return true;
        }
    }
    return false;
}

function isPointInPoly(pt, polyIndices, points) {
    var inside = false;
    for (var i = 0, j = polyIndices.length - 1; i < polyIndices.length; j = i++) {
        var pi = points[polyIndices[i] + 3];
        var pj = points[polyIndices[j] + 3];

        if (((pi.y > pt.y) !== (pj.y > pt.y)) &&
            (pt.x < (pj.x - pi.x) * (pt.y - pi.y) / (pj.y - pi.y) + pi.x)) {
            inside = !inside;
        }
    }
    return inside;
}