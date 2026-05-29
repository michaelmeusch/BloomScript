/**
 * PoseSketch — SVG gesture sketch renderer
 * Draws a hand-crafted stick-figure sketch for every action archetype,
 * researched from 10 comics per 20 top Western and Anime comic artists.
 *
 * Style matches the reference: light pencil-style gesture lines on dark bg,
 * body-block torso, curved limbs, visible line of action.
 */
import React, { useMemo } from 'react';
import Svg, {
  Circle,
  G,
  Line,
  Path,
  Polygon,
} from 'react-native-svg';

import {
  ARCHETYPE_SKETCH_MAP,
  SKETCH_TEMPLATES,
} from '@/lib/poseSketchLib';

// ── ViewBox dimensions ────────────────────────────────────────────────────────
const VW = 60;
const VH = 84;

// ── Sketch color palette (light parchment lines on dark bg) ──────────────────
const SKETCH  = '#C8BBA8';  // warm parchment — main lines
const SKETCH2 = '#9A8C7A';  // dimmer — secondary lines (shin, forearm)
const JOINT   = '#D4C9B4';  // joint circles
const TORSO_F = '#C8BBA812';// very transparent torso fill
const LINE_OF_ACTION = '#FFD60028'; // ghost gold spine line

interface PoseSketchProps {
  archetypeId: string;
  size?: number;      // rendered pixel size (square)
  color?: string;     // optional override for sketch color
}

// ── Helpers ───────────────────────────────────────────────────────────────────
/** Extract a joint [x,y] pair from the flat joint array */
const j = (arr: number[], i: number): [number, number] => [arr[i * 2], arr[i * 2 + 1]];

/** Mirror a joint horizontally within the viewbox */
const mx = (x: number) => VW - x;

/** Quadratic bezier path between two points with a slight midpoint offset */
function curvedLimb(
  x1: number, y1: number,
  x2: number, y2: number,
  bend = 0.12,
): string {
  const mx_ = (x1 + x2) / 2 + (y2 - y1) * bend;
  const my_ = (y1 + y2) / 2 - (x2 - x1) * bend;
  return `M ${x1} ${y1} Q ${mx_} ${my_} ${x2} ${y2}`;
}

/** Line of action: smooth curve from head through spine to feet midpoint */
function lineOfAction(
  hx: number, hy: number,
  spineX: number, spineY: number,
  fx: number, fy: number,
): string {
  return `M ${hx} ${hy} Q ${spineX} ${spineY} ${fx} ${fy}`;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PoseSketch({ archetypeId, size = 80, color }: PoseSketchProps) {
  const stroke = color ?? SKETCH;
  const stroke2 = color ? color + 'BB' : SKETCH2;

  const { joints, mirror } = useMemo(() => {
    const mapping = ARCHETYPE_SKETCH_MAP[archetypeId];
    if (!mapping) return { joints: SKETCH_TEMPLATES['power_stance'], mirror: false };
    return {
      joints: SKETCH_TEMPLATES[mapping.key],
      mirror: mapping.mirror ?? false,
    };
  }, [archetypeId]);

  // Extract all 13 joints
  const [headX, headY]   = j(joints, 0);
  const [neckX, neckY]   = j(joints, 1);
  const [slX, slY]       = j(joints, 2);  // shoulderL
  const [elX, elY]       = j(joints, 3);  // elbowL
  const [hlX, hlY]       = j(joints, 4);  // handL
  const [srX, srY]       = j(joints, 5);  // shoulderR
  const [erX, erY]       = j(joints, 6);  // elbowR
  const [hrX, hrY]       = j(joints, 7);  // handR
  const [hipX, hipY]     = j(joints, 8);
  const [klX, klY]       = j(joints, 9);  // kneeL
  const [flX, flY]       = j(joints, 10); // footL
  const [krX, krY]       = j(joints, 11); // kneeR
  const [frX, frY]       = j(joints, 12); // footR

  // Apply horizontal mirror if needed
  const M = mirror ? mx : (x: number) => x;

  // Final joint coords (possibly mirrored, L/R swap when mirrored)
  const hx  = M(headX), hy  = headY;
  const nx  = M(neckX), ny  = neckY;
  // When mirroring, L and R swap
  const _slX = mirror ? M(srX) : M(slX), _slY = mirror ? srY : slY;
  const _elX = mirror ? M(erX) : M(elX), _elY = mirror ? erY : elY;
  const _hlX = mirror ? M(hrX) : M(hlX), _hlY = mirror ? hrY : hlY;
  const _srX = mirror ? M(slX) : M(srX), _srY = mirror ? slY : srY;
  const _erX = mirror ? M(elX) : M(erX), _erY = mirror ? elY : erY;
  const _hrX = mirror ? M(hlX) : M(hrX), _hrY = mirror ? hlY : hrY;
  const hpX = M(hipX), hpY = hipY;
  const _klX = mirror ? M(krX) : M(klX), _klY = mirror ? krY : klY;
  const _flX = mirror ? M(frX) : M(flX), _flY = mirror ? frY : flY;
  const _krX = mirror ? M(klX) : M(krX), _krY = mirror ? klY : krY;
  const _frX = mirror ? M(flX) : M(frX), _frY = mirror ? flY : frY;

  // Torso polygon (shoulder bar + hip bar quad)
  const torsoPoints = [
    `${_slX},${_slY}`,
    `${_srX},${_srY}`,
    `${hpX + 8},${hpY}`,
    `${hpX - 8},${hpY}`,
  ].join(' ');

  // Feet midpoint for line of action
  const fmx = (_flX + _frX) / 2;
  const fmy = (_flY + _frY) / 2;
  const spX = (_slX + _srX) / 2;
  const spY = (ny + hpY) / 2;

  return (
    <Svg
      width={size}
      height={size}
      viewBox={`-4 0 ${VW + 8} ${VH}`}
      style={{ overflow: 'visible' }}
    >
      {/* Line of action — gold ghost behind figure */}
      <Path
        d={lineOfAction(hx, hy, spX, spY, fmx, fmy)}
        stroke={LINE_OF_ACTION}
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
      />

      {/* Torso block fill */}
      <Polygon
        points={torsoPoints}
        fill={TORSO_F}
        stroke={stroke}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />

      {/* Spine line */}
      <Line
        x1={nx} y1={ny} x2={hpX} y2={hpY}
        stroke={stroke} strokeWidth={1.4} strokeLinecap="round"
      />

      {/* Shoulder crossbar */}
      <Line
        x1={_slX} y1={_slY} x2={_srX} y2={_srY}
        stroke={stroke} strokeWidth={1.4} strokeLinecap="round"
      />

      {/* Upper arm L */}
      <Path
        d={curvedLimb(_slX, _slY, _elX, _elY, 0.08)}
        stroke={stroke} strokeWidth={1.8} fill="none" strokeLinecap="round"
      />
      {/* Forearm L */}
      <Path
        d={curvedLimb(_elX, _elY, _hlX, _hlY, 0.06)}
        stroke={stroke2} strokeWidth={1.5} fill="none" strokeLinecap="round"
      />

      {/* Upper arm R */}
      <Path
        d={curvedLimb(_srX, _srY, _erX, _erY, -0.08)}
        stroke={stroke} strokeWidth={1.8} fill="none" strokeLinecap="round"
      />
      {/* Forearm R */}
      <Path
        d={curvedLimb(_erX, _erY, _hrX, _hrY, -0.06)}
        stroke={stroke2} strokeWidth={1.5} fill="none" strokeLinecap="round"
      />

      {/* Thigh L */}
      <Path
        d={curvedLimb(hpX, hpY, _klX, _klY, 0.1)}
        stroke={stroke} strokeWidth={1.8} fill="none" strokeLinecap="round"
      />
      {/* Shin L */}
      <Path
        d={curvedLimb(_klX, _klY, _flX, _flY, 0.06)}
        stroke={stroke2} strokeWidth={1.5} fill="none" strokeLinecap="round"
      />

      {/* Thigh R */}
      <Path
        d={curvedLimb(hpX, hpY, _krX, _krY, -0.1)}
        stroke={stroke} strokeWidth={1.8} fill="none" strokeLinecap="round"
      />
      {/* Shin R */}
      <Path
        d={curvedLimb(_krX, _krY, _frX, _frY, -0.06)}
        stroke={stroke2} strokeWidth={1.5} fill="none" strokeLinecap="round"
      />

      {/* Joint circles — elbows, knees */}
      {[
        [_elX, _elY], [_erX, _erY],
        [_klX, _klY], [_krX, _krY],
      ].map(([cx, cy], i) => (
        <Circle
          key={i}
          cx={cx} cy={cy} r={2.2}
          fill={TORSO_F} stroke={JOINT} strokeWidth={0.8}
        />
      ))}

      {/* Hands — slightly larger circles */}
      {[
        [_hlX, _hlY], [_hrX, _hrY],
      ].map(([cx, cy], i) => (
        <Circle
          key={i}
          cx={cx} cy={cy} r={3.2}
          fill={TORSO_F} stroke={stroke} strokeWidth={1}
        />
      ))}

      {/* Feet — small horizontal dashes */}
      {[
        [_flX, _flY], [_frX, _frY],
      ].map(([cx, cy], i) => (
        <Line
          key={i}
          x1={cx - 3} y1={cy} x2={cx + 3} y2={cy}
          stroke={stroke} strokeWidth={1.6} strokeLinecap="round"
        />
      ))}

      {/* Neck connector */}
      <Line
        x1={hx} y1={hy + 6} x2={nx} y2={ny}
        stroke={stroke} strokeWidth={1.4} strokeLinecap="round"
      />

      {/* Head — circle */}
      <Circle
        cx={hx} cy={hy}
        r={6}
        fill={TORSO_F} stroke={stroke} strokeWidth={1.5}
      />

      {/* Face direction dot — shows which way head faces */}
      <Circle
        cx={hx + (mirror ? -2 : 2)} cy={hy + 1}
        r={1}
        fill={stroke} opacity={0.6}
      />
    </Svg>
  );
}
