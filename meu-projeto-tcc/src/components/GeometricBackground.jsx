import { useMemo } from 'react';

// Coordenadas dos nós da malha geométrica [x%, y%]
// Concentrados nos cantos inferiores (como a imagem FIEMG)
const nodes = [
  // ─── Canto inferior-esquerdo (denso) ───
  [0,100],[3,91],[7,97],[11,85],[0,87],[5,79],[13,89],
  [19,83],[25,93],[0,73],[7,69],[15,75],[23,81],[29,91],
  [0,59],[5,53],[13,57],[21,63],[29,73],[35,83],
  [0,45],[7,39],[15,34],[23,43],[31,53],[37,65],
  [0,32],[5,22],[13,16],[21,26],[29,36],

  // ─── Canto inferior-direito (denso) ───
  [100,100],[97,91],[93,97],[89,85],[100,87],[95,79],[87,89],
  [81,83],[75,93],[100,73],[93,69],[85,75],[77,81],[71,91],
  [100,59],[95,53],[87,57],[79,63],[71,73],[65,83],
  [100,45],[93,39],[85,34],[77,43],[69,53],[63,65] ,
  [100,32],[95,22],[87,16],[79,26],[71,36],

  // ─── Bordas superiores (esparso) ───
  [0,18],[0,7],[7,5],[16,9],[26,4],[36,7],[46,3],
  [54,7],[64,4],[74,9],[84,5],[93,8],[100,5],[100,18],

  // ─── Centro (muito esparso) ───
  [43,38],[50,32],[57,38],[47,50],[53,56],[45,25],[55,25],[50,45],
];

export default function GeometricBackground() {
  // Calcula as conexões entre nós próximos
  const lines = useMemo(() => {
    const result = [];
    const maxDist = 15;

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i][0] - nodes[j][0];
        const dy = nodes[i][1] - nodes[j][1];
        const d = Math.sqrt(dx * dx + dy * dy);

        if (d > 1.5 && d < maxDist) {
          const opacity = Math.max(0.05, 0.45 * (1 - d / maxDist));
          result.push([nodes[i][0], nodes[i][1], nodes[j][0], nodes[j][1], opacity]);
        }
      }
    }
    return result;
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* Linhas de conexão (SVG) */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="mesh-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        {lines.map((l, i) => (
          <line
            key={i}
            x1={l[0]} y1={l[1]} x2={l[2]} y2={l[3]}
            className="mesh-line"
            strokeWidth="0.07"
            style={{ opacity: l[4] }}
          />
        ))}
      </svg>

      {/* Pontos/nós (divs para manter formato circular) */}
      {nodes.map(([x, y], i) => {
        const isEdge = x < 8 || x > 92 || y < 10 || y > 88;
        return (
          <div
            key={i}
            className="mesh-dot"
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              width: isEdge ? 4.5 : 3,
              height: isEdge ? 4.5 : 3,
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)',
              opacity: isEdge ? 0.5 : 0.25,
            }}
          />
        );
      })}
    </div>
  );
}
