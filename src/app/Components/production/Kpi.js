import { Card } from "react-bootstrap";
const KpiCard = ({ href, icon, title, value, bg }) => (
    <a href={href} className="text-decoration-none text-dark">
        <Card className={`h-100 shadow-sm border-0 kpi-card ${bg ? `bg-${bg}` : '' }` }>
            <Card.Body className="d-flex align-items-center">
                <div className="flex-shrink-0 me-3">{icon}</div>
                <div>
                    <div className="text-muted small">{title}</div>
                    <div className="h5 fw-bold mb-0">{value}</div>
                </div>
                <div className="ms-auto text-muted">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-right-circle" viewBox="0 0 16 16"><path fillRule="evenodd" d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8zm15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM4.5 7.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H4.5z"/></svg>
                </div>
            </Card.Body>
        </Card>
    </a>
);

export default KpiCard;