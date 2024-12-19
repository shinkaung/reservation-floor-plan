import React from 'react';
import { Card, ListGroup, Form } from 'react-bootstrap';
import { Table, TimeSlot, Status, ReservationType } from '../types';

interface TableTimeSlotsProps {
    table: Table;
    onStatusChange: (tableId: string, timeSlot: string, newStatus: Status, reservationType: ReservationType) => void;
}

const TableTimeSlots: React.FC<TableTimeSlotsProps> = ({ table, onStatusChange }) => {
    return (
        <Card className="h-100">
            <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">{table.name}</h5>
            </Card.Header>
            <Card.Body className="p-0">
                <ListGroup variant="flush">
                    {table.timeSlots.map((slot, index) => (
                        <ListGroup.Item key={index} 
                            className={`${
                                slot.status === 'phone-call' ? 'bg-danger-subtle' :
                                slot.status === 'walk-in' ? 'bg-info-subtle' :
                                'bg-light'
                            }`}
                        >
                            <div className="d-flex flex-column">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                    <small>{slot.time}</small>
                                    <Form.Select 
                                        size="sm" 
                                        style={{ width: '120px' }}
                                        value={slot.status}
                                        onChange={(e) => {
                                            const newStatus = e.target.value as Status;
                                            const reservationType = newStatus === ('phone-call' as Status) ? 'phone' : 'walk-in';
                                            onStatusChange(
                                                table.id, 
                                                slot.time, 
                                                newStatus,
                                                reservationType
                                            );
                                        }}
                                    >
                                        <option value="available">Available</option>
                                        <option value="walk-in">Walk-in</option>
                                        <option value="phone-call">Phone Call</option>
                                    </Form.Select>
                                </div>
                                {(slot.status === 'phone-call' || slot.status === 'walk-in') && (
                                    <div className="d-flex justify-content-between align-items-center">
                                        <small className="text-muted">
                                            {slot.status === 'phone-call' ? 'Phone call' : 'Walk in'}
                                        </small>
                                        {slot.customerName && (
                                            <small className="text-muted">
                                                {slot.customerName} ({slot.pax} pax)
                                            </small>
                                        )}
                                    </div>
                                )}
                            </div>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            </Card.Body>
        </Card>
    );
};

export default TableTimeSlots;