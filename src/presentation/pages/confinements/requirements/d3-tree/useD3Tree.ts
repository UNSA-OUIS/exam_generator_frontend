import * as d3 from "d3";
import { useEffect, useRef } from "react";
import type { NodeData } from "./types";

interface UseD3TreeParams {
    data: NodeData;
    width: number;
    height: number;
    isMobile: boolean;
    isTablet: boolean;
    onNodeClick?: (node: NodeData) => void;
    onNodeContext?: (node: NodeData, event: MouseEvent) => void;
}

export function useD3Tree({ data, width, height, isMobile, isTablet, onNodeClick, onNodeContext }: UseD3TreeParams) {
    console.log("D3 INIT");

    const svgRef = useRef<SVGSVGElement | null>(null);

    useEffect(() => {
        if (!data || !svgRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); // reset on data change

        const g = svg.append("g");

        // ---- ZOOM BEHAVIOR ----
        const zoomBehavior = d3
            .zoom<SVGSVGElement, unknown>()
            .filter((event) => {
                // Ignore right-click (button === 2)
                if (event.button === 2) return false;

                // Ignore ctrl+wheel (which browsers often use for zoom)
                if (event.type === "wheel" && event.ctrlKey) return false;

                return true; // all other interactions allowed
            })
            .scaleExtent([0.01, 10])
            .on("zoom", (event) => g.attr("transform", event.transform));

        svg.call(zoomBehavior);

        // ---- TOOLTIP ----
        const tooltip = d3
            .select("body")
            .append("div")
            .style("position", "absolute")
            .style("background", "rgba(0,0,0,0.85)")
            .style("color", "#fff")
            .style("padding", "8px 12px")
            .style("border-radius", "6px")
            .style("pointer-events", "none")
            .style("font-size", isMobile ? "11px" : "12px")
            .style("opacity", 0)
            .style("z-index", "9999");

        const root = d3.hierarchy<NodeData>(data);

        // ---- RESPONSIVE SIZES ----
        let nodeRadius, nodeSizeX, nodeSizeY, fontSize, difficultySize;

        if (isMobile) {
            nodeRadius = 14;
            nodeSizeX = 60;
            nodeSizeY = 80;
            fontSize = "10px";
            difficultySize = 8;
        } else if (isTablet) {
            nodeRadius = 20;
            nodeSizeX = 80;
            nodeSizeY = 100;
            fontSize = "12px";
            difficultySize = 10;
        } else {
            nodeRadius = 28;
            nodeSizeX = 120;
            nodeSizeY = 150;
            fontSize = "20px";
            difficultySize = 12;
        }

        const tempLayout = d3.tree<NodeData>().nodeSize([nodeSizeX, nodeSizeY]);
        const tempRoot = tempLayout(root);

        if (tempRoot.height > 6) {
            const scale = isMobile ? 0.7 : isTablet ? 0.8 : 0.9;
            nodeRadius *= scale;
            nodeSizeX *= scale;
            nodeSizeY *= scale;
        }

        const layout = d3.tree<NodeData>().nodeSize([nodeSizeX, nodeSizeY]);
        const treeRoot = layout(root);

        // ---- BOUNDS / VIEWBOX ----
        let x0 = Infinity,
            x1 = -Infinity,
            y0 = Infinity,
            y1 = -Infinity;

        treeRoot.each((d) => {
            if (d.x < x0) x0 = d.x;
            if (d.x > x1) x1 = d.x;
            if (d.y < y0) y0 = d.y;
            if (d.y > y1) y1 = d.y;
        });

        const margin = isMobile ? 50 : 70;
        const vbWidth = x1 - x0 + margin * 2;
        const vbHeight = y1 - y0 + margin * 2;

        g.attr("transform", `translate(${margin - x0},${margin - y0})`);

        // ---- LINKS ----
        const linkGen = d3
            .linkVertical<any, any>()
            .x((d) => d.x)
            .y((d) => d.y);

        g.selectAll("path.link")
            .data(treeRoot.links())
            .join("path")
            .attr("class", "link")
            .attr("fill", "none")
            .attr("stroke", "#bbb")
            .attr("stroke-width", isMobile ? 1 : 1.2)
            .attr("d", (d: any) => linkGen(d));

        // ---- NODES ----
        const node = g
            .selectAll("g.node")
            .data(treeRoot.descendants())
            .join("g")
            .attr("class", "node")
            .attr("transform", (d) => `translate(${d.x},${d.y})`)
            .attr("cursor", "pointer")
            .on("click", (_, d: any) => onNodeClick?.(d.data))
            .on("contextmenu", (event: MouseEvent, d: any) => {
                event.preventDefault();
                event.stopPropagation(); // <---- IMPORTANT
                onNodeContext?.(d.data, event);
            })
            .on("mouseover", (event: any, d: any) => {
                const nd: NodeData = d.data;
                let html = `<strong>${nd.block?.name ?? "Total"}</strong><br/>Preguntas: ${nd.n_questions}`;
                if (nd.difficulty) html += ` | Dificultad: ${nd.difficulty}`;
                if (nd.block) html += ` | Código: ${nd.block.code} | Nivel: ${nd.block.level_id}`;

                tooltip
                    .style("opacity", 1)
                    .html(html)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 28}px`);
            })
            .on("mousemove", (event: any) => {
                tooltip.style("left", `${event.pageX + 10}px`).style("top", `${event.pageY - 28}px`);
            })
            .on("mouseout", () => tooltip.style("opacity", 0));

        // ---- CIRCLE ----
        node.append("circle")
            .attr("r", nodeRadius)
            .attr("fill", (d: any) => {
                const nd = d.data;
                if (nd.condition === "INCOMPLETE") return "#e5e7eb";
                if (nd.condition === "INVALID") return "#fd7d7d";
                return "#95f100";
            })
            .attr("stroke", "#333")
            .attr("stroke-width", isMobile ? 1 : 1.5);

        // ---- LABEL: number of questions ----
        node.append("text")
            .attr("dy", nodeRadius / 4)
            .attr("text-anchor", "middle")
            .style("font-size", fontSize)
            .style("font-weight", "700")
            .attr("fill", "#111")
            .text((d: any) => d.data.n_questions);

        // ---- LABEL: block code ----
        node.append("text")
            .attr("dy", nodeRadius + (isMobile ? 8 : 12))
            .attr("text-anchor", "middle")
            .style("font-size", isMobile ? "9px" : "11px")
            .style("fill", "#374151")
            .text((d: any) => {
                const block = d.data.block;
                if (!block) return "(total)";
                let code = "";
                if (block.level_id < 3) code = block.name ?? "";
                else code = block.code ?? "";
                return isMobile && code.length > 8 ? code.slice(0, 6) + "..." : code;
            });

        // ---- DIFFICULTY BADGE ----
        node.filter((d: any) => !!d.data.difficulty)
            .append("g")
            .attr("transform", `translate(${-Math.round(nodeRadius * 0.65)},${-Math.round(nodeRadius * 0.6)})`)
            .call((g: any) => {
                g.append("rect")
                    .attr("width", Math.round(nodeRadius * 0.7))
                    .attr("height", Math.round(nodeRadius * 0.7))
                    .attr("x", -Math.round(nodeRadius * 0.35))
                    .attr("y", -Math.round(nodeRadius * 0.45))
                    .attr("rx", 3)
                    .attr("fill", "#fff")
                    .attr("stroke", "#333")
                    .attr("opacity", 0.95);

                g.append("text")
                    .attr("text-anchor", "middle")
                    .attr("y", Math.round(nodeRadius * 0.12))
                    .style("font-size", `${difficultySize}px`)
                    .style("font-weight", "700")
                    .text((d: any) => d.data.difficulty?.charAt(0));
            });

        // ---- VIEWBOX ----
        svg.attr("viewBox", `0 0 ${vbWidth} ${vbHeight}`);

        // ---- INITIAL ZOOM ----
        const initialScale = isMobile ? 0.8 : isTablet ? 1.2 : 1.5;
        svg.call(zoomBehavior.transform, d3.zoomIdentity.translate(vbWidth / 2, vbHeight / 3).scale(initialScale));

        return () => {
            console.log("D3 DESTROY");
            tooltip.remove();
        };
    }, [data, width, height]);

    return { svgRef };
}
