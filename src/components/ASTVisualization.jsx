import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const ASTVisualization = ({ ast }) => {
  const d3Container = useRef(null);

  useEffect(() => {
    if (ast && d3Container.current) {
      // Limpiar el SVG anterior
      d3.select(d3Container.current).selectAll("*").remove();

      const width = 800;
      const height = 600;
      const margin = { top: 20, right: 120, bottom: 20, left: 120 };

      // Crear el SVG
      const svg = d3.select(d3Container.current)
        .attr('width', width)
        .attr('height', height);

      // Crear el grupo principal con margen
      const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // Función para procesar el AST y convertirlo en un formato adecuado para d3
      const processAST = (node) => {
        let children = [];
        if (node.body) {
          children = Array.isArray(node.body) ? node.body : [node.body];
        } else if (node.left || node.right) {
          children = [node.left, node.right].filter(Boolean);
        } else if (node.condition) {
          children = [node.condition, node.thenBlock, node.elseBlock].filter(Boolean);
        } else if (node.expression) {
          children = [node.expression];
        } else if (node.initialValue) {
          children = [node.initialValue];
        } else if (node.argument) {
          children = [node.argument];
        }
        
        return {
          name: node.type || (typeof node === 'number' ? node.toString() : JSON.stringify(node)),
          children: children.map(processAST)
        };
      };

      const root = d3.hierarchy(processAST(ast));

      // Configurar el layout del árbol
      const treeLayout = d3.tree().size([height - margin.top - margin.bottom, width - margin.left - margin.right]);

      // Aplicar el layout
      treeLayout(root);

      // Crear las conexiones entre nodos
      const link = g.selectAll(".link")
        .data(root.links())
        .enter().append("path")
        .attr("class", "link")
        .attr("d", d3.linkHorizontal()
          .x(d => d.y)
          .y(d => d.x))
        .attr("fill", "none")
        .attr("stroke", "#999")
        .attr("stroke-width", 1);

      // Crear los nodos
      const node = g.selectAll(".node")
        .data(root.descendants())
        .enter().append("g")
        .attr("class", d => "node" + (d.children ? " node--internal" : " node--leaf"))
        .attr("transform", d => `translate(${d.y},${d.x})`);

      // Agregar círculos a los nodos
      node.append("circle")
        .attr("r", 5)
        .attr("fill", d => d.children ? "#3498db" : "#e74c3c");

      // Agregar etiquetas a los nodos
      node.append("text")
        .attr("dy", ".35em")
        .attr("x", d => d.children ? -10 : 10)
        .style("text-anchor", d => d.children ? "end" : "start")
        .text(d => d.data.name)
        .attr("font-size", "12px")
        .attr("fill", "currentColor");
    }
  }, [ast]);

  return (
    <svg 
      className="d3-component" 
      ref={d3Container}
      viewBox={`0 0 ${800} ${600}`}
      style={{
        width: '100%',
        height: '100%',
        maxHeight: '600px',
        overflow: 'auto'
      }}
    />
  );
};

export default ASTVisualization;

