import React, { useEffect, useRef, useState } from "react";
import { useTheme, useMediaQuery } from "@mui/material";
import { useD3Tree } from "./useD3Tree";
import type { NodeData } from "./types";

interface Props {
    data: NodeData;
    onNodeClick?: (node: NodeData) => void;
    onNodeContext?: (node: NodeData, event: MouseEvent) => void;
}

function D3TreeComponent({ data, onNodeClick, onNodeContext }: Props) {
    console.log("D3Tree render", { data, onNodeClick, onNodeContext });

    const containerRef = useRef<HTMLDivElement | null>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const isTablet = useMediaQuery(theme.breakpoints.down("lg"));

    // ResizeObserver for dynamic container size
    useEffect(() => {
        if (!containerRef.current) return;

        const obs = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setDimensions({
                    width: Math.max(entry.contentRect.width, 400),
                    height: Math.max(entry.contentRect.height, 300),
                });
            }
        });

        obs.observe(containerRef.current);
        return () => obs.disconnect();
    }, []);

    // Hook with D3 rendering
    const { svgRef } = useD3Tree({
        data,
        width: dimensions.width,
        height: dimensions.height,
        isMobile,
        isTablet,
        onNodeClick,
        onNodeContext,
    });

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "70vh",
                minHeight: "400px",
                overflow: "auto",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                backgroundColor: "#fafafa",
            }}>
            <svg
                ref={svgRef}
                width="100%"
                height="100%"
                style={{
                    minWidth: "400px",
                    minHeight: "300px",
                }}
            />
        </div>
    );
}

export const D3Tree = React.memo(D3TreeComponent);
export default D3Tree;
