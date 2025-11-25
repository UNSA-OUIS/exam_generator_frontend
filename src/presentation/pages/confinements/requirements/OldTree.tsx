import { useRef, useEffect } from "react";
import * as d3 from "d3";

type Condition = "COMPLETE" | "INCOMPLETE" | "INVALID";

export interface NodeData {
    id: number;
    block: { id: number; code: string; name: string } | null;
    n_questions: number;
    condition: Condition;
    difficulty: string | null;
    children: NodeData[];
}

interface TreeProps {
    data: NodeData;
    onNodeClick?: (id: number) => void;
}

export default function Tree({ data, onNodeClick }: TreeProps) {
    const svgRef = useRef<SVGSVGElement | null>(null);

    useEffect(() => {
        if (!data || !svgRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const width = 1000;
        const height = 1200;

        const zoomGroup = svg.append("g");

        // Tooltip setup
        const tooltip = d3
            .select("body") // ✅ append to body, not container
            .append("div")
            .style("position", "absolute")
            .style("background", "rgba(0,0,0,0.7)")
            .style("color", "#fff")
            .style("padding", "6px 10px")
            .style("border-radius", "6px")
            .style("pointer-events", "none")
            .style("font-size", "12px")
            .style("z-index", "9999")
            .style("opacity", 0);

        // ✅ Zoom & Pan setup
        const zoomBehavior = d3
            .zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.05, 8])
            .on("zoom", (event) => zoomGroup.attr("transform", event.transform));

        svg.call(zoomBehavior);

        // ✅ Prepare data hierarchy
        const root = d3.hierarchy<NodeData>(data);
        const treeLayout = d3.tree<NodeData>().nodeSize([60, 80]);
        const treeRoot = treeLayout(root);

        // ✅ Link generator
        const linkGenerator = d3
            .linkVertical<d3.HierarchyPointLink<NodeData>, d3.HierarchyPointNode<NodeData>>()
            .x((d) => d.x)
            .y((d) => d.y);

        // ✅ Draw links
        zoomGroup
            .selectAll("path.link")
            .data(treeRoot.links())
            .join("path")
            .attr("fill", "none")
            .attr("stroke", "#bbb")
            .attr("stroke-width", 1.2)
            .attr("d", (d) => linkGenerator(d)!);

        // ✅ Draw nodes
        const node = zoomGroup
            .selectAll("g.node")
            .data(treeRoot.descendants())
            .join("g")
            .attr("class", "node")
            .attr("transform", (d) => `translate(${d.x},${d.y})`)
            .attr("cursor", "pointer")
            .on("click", (_, d) => onNodeClick?.(d.data.id))
            .on("mouseover", (event, d) => {
                tooltip
                    .style("opacity", 1)
                    .html(`<strong>${d.data.block?.name ?? "Total"}</strong><br/>${d.data.n_questions} preguntas ${d.data.difficulty ?? ""}`)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 28}px`);
            })
            .on("mousemove", (event) => {
                tooltip.style("left", `${event.pageX + 10}px`).style("top", `${event.pageY - 28}px`);
            })
            .on("mouseout", () => {
                tooltip.style("opacity", 0);
            });

        // ✅ Node circles
        node.append("circle")
            .attr("r", 20)
            .attr("fill", (d) => (d.data.condition === "COMPLETE" ? "#4ade80" : d.data.condition === "INCOMPLETE" ? "#1524faff" : "#ef4444"))
            .attr("stroke", "#333")
            .attr("stroke-width", 1.2);

        // Difficulty labels with background
        const difficultyLabels = node
            .filter((d) => !!d.data.difficulty)
            .append("g") // group for text + background
            .attr("class", "difficulty-label")
            .attr("transform", "translate(-14,-12)"); // offset from node center

        // Background circle (or rounded rect)
        difficultyLabels
            .append("rect")
            .attr("x", -6)
            .attr("y", -8)
            .attr("width", 12)
            .attr("height", 12)
            .attr("rx", 3) // rounded corners
            .attr("fill", "#fff")
            .attr("stroke", "#333")
            .attr("stroke-width", 0.5)
            .attr("opacity", 0.9);

        // Difficulty text
        difficultyLabels
            .append("text")
            .attr("text-anchor", "middle")
            .attr("x", 0)
            .attr("y", 2.5)
            .attr("fill", "#111")
            .attr("font-size", "9px")
            .attr("font-weight", "700")
            .text((d) => d.data.difficulty!.charAt(0).toUpperCase());

        // ✅ Centered number inside node
        node.append("text")
            .attr("dy", 5)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .style("font-weight", "600")
            .attr("fill", "#111")
            .text((d) => d.data.n_questions);

        // ✅ Block code below node
        node.append("text")
            .attr("dy", 34)
            .attr("text-anchor", "middle")
            .style("font-size", "11px")
            .style("fill", "#374151")
            .text((d) => d.data.block?.code ?? "(root)");

        // ✅ Draw boundaries
        const bounds = zoomGroup.node()!.getBBox();
        zoomGroup
            .append("rect")
            .attr("x", bounds.x - 40)
            .attr("y", bounds.y - 40)
            .attr("width", bounds.width + 80)
            .attr("height", bounds.height + 80)
            .attr("fill", "none")
            .attr("stroke", "#9ca3af")
            .attr("stroke-dasharray", "4 2");

        // ✅ Default zoom centered on root node
        const scale = 1.5;
        const translateX = width / 2 - treeRoot.x * scale;
        const translateY = height / 3 - treeRoot.y * scale;

        svg.call(zoomBehavior.transform, d3.zoomIdentity.translate(translateX, translateY).scale(scale));

        return () => {
            tooltip.remove();
        };
    }, [data, onNodeClick]);

    return (
        <div
            style={{
                width: "100%",
                height: "100vh",
                overflow: "auto",
            }}>
            {/*<h1 className="text-2xl font-bold">Requerimientos del internamiento</h1>*/}

            <svg ref={svgRef} width="100%" height="100%" viewBox={`0 0 1000 1200`} className="border rounded-md bg-white shadow cursor-grab" />
        </div>
    );
}
