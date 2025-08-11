import React, { useState, useCallback } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from "react-flow-renderer";
import { Card, Container, Row, Col, Form, Button, Modal } from "react-bootstrap";

const initialNodes = [
  { id: "1", position: { x: 50, y: 100 }, data: { label: "Raw Material Intake", details: "" }, style: { backgroundColor: "#f8d7da" } },
  { id: "2", position: { x: 50, y: 200 }, data: { label: "Production Process", details: "" }, style: { backgroundColor: "#fff3cd" } },
  { id: "3", position: { x: 50, y: 300 }, data: { label: "Quality Check", details: "" }, style: { backgroundColor: "#d4edda" } },
  { id: "4", position: { x: 50, y: 400 }, data: { label: "Storage", details: "" }, style: { backgroundColor: "#cce5ff" } },
  { id: "5", position: { x: 50, y: 500 }, data: { label: "Dispatch", details: "" }, style: { backgroundColor: "#d1c4e9" } },
  { id: "output", position: { x: 500, y: 300 }, data: { label: "Process Details" }, style: { backgroundColor: "#e0e0e0" } },
];

const initialEdges = [
  { id: "e1-output", source: "1", target: "output", animated: true },
  { id: "e2-output", source: "2", target: "output", animated: true },
  { id: "e3-output", source: "3", target: "output", animated: true },
  { id: "e4-output", source: "4", target: "output", animated: true },
  { id: "e5-output", source: "5", target: "output", animated: true },
];

const ProductionFlow = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges] = useEdgesState(initialEdges);
  const [selectedStage, setSelectedStage] = useState(null);
  const [stageDetails, setStageDetails] = useState("");
  const [showModal, setShowModal] = useState(false);

  const onNodeClick = (event, node) => {
    if (node.id !== "output") {
      setSelectedStage(node);
      setStageDetails(node.data.details);
      setShowModal(true);
    }
  };

  const handleDetailsChange = (event) => {
    setStageDetails(event.target.value);
  };

  const handleSaveDetails = () => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === selectedStage.id ? { ...node, data: { ...node.data, details: stageDetails } } : node
      )
    );
    setShowModal(false);
  };

  return (
    <Container fluid className="mt-4">
      <Row>
        <Col md={9}>
          <Card className="h-100">
            <Card.Body>
              <Card.Title>Factory Workflow</Card.Title>
              <div style={{ width: "100%", height: "80vh", border: "1px solid #ddd" }}>
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onNodeClick={onNodeClick}
                  fitView
                >
                  <MiniMap />
                  <Controls />
                  <Background />
                </ReactFlow>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100">
            <Card.Body>
              <Card.Title>Process Details</Card.Title>
              {nodes.filter(node => node.id !== "output").map(node => (
                <Card key={node.id} className="mb-2">
                  <Card.Body>
                    <Card.Title>{node.data.label}</Card.Title>
                    <Card.Text>{node.data.details || "No details provided"}</Card.Text>
                  </Card.Body>
                </Card>
              ))}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{selectedStage?.data.label} Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="stageDetails">
              <Form.Label>Enter Details</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={stageDetails}
                onChange={handleDetailsChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSaveDetails}>
            Save Details
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ProductionFlow;
