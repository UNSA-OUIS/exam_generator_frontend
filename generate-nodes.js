import fs from "fs";

// Generate a deep + wide tree for visualization testing
function generateTree(level = 1, maxDepth = 10, width = 8, parentId = 1) {
    if (level > maxDepth) return [];

    const children = [];
    for (let i = 0; i < width; i++) {
        const id = Number(`${level}${i}${parentId}`);
        const conditionOptions = ["COMPLETE", "INCOMPLETE", "INVALID"];
        const condition = conditionOptions[Math.floor(Math.random() * 3)];

        const node = {
            id,
            block: { id: i, name: `Block L${level}-#${i}` },
            questions_to_do: Math.floor(Math.random() * 50) + 10,
            condition,
            children: generateTree(level + 1, maxDepth, Math.floor(width / 2), id),
        };

        children.push(node);
    }

    return children;
}

const tree = {
    id: 1,
    block: { id: null, name: "Root" },
    questions_to_do: 100,
    condition: "COMPLETE",
    children: generateTree(1, 10, 8, 1), // depth=10, width≈8 per level
};

// Write to JSON file
fs.writeFileSync("tree.json", JSON.stringify(tree, null, 2));
console.log("✅ tree.json generated successfully!");
