import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { format } from 'date-fns';
import Airtable from 'airtable';
import { Table, TimeSlot, Status, ReservationType } from '../types';
import TableTimeSlots from './TableTimeSlots';

// Initialize Airtable
const base = new Airtable({
    apiKey: 'patSM7srrQNAGryRf.b044624fb90f100f1f4bd7efda8f40f4176863ef1b9206aeeff78e2e6437f2e9'  // Replace with your API key
}).base('appuI5cRKzcI7c86H');  

// Function to fetch reservations
const getReservations = async () => {
    try {
        // Get today's date in ISO format
        const now = new Date();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        const endOfDay = new Date(now.setHours(23, 59, 59, 999)).toISOString();

        // Create filter formula similar to your Google Apps Script
        const filterFormula = `AND(
            IS_AFTER({DateandTime}, '${startOfDay}'),
            IS_BEFORE({DateandTime}, '${endOfDay}')
        )`;

        const records = await base('Reservation')
            .select({
                filterByFormula: filterFormula
            })
            .all();

        console.log('Raw Airtable response:', records); // Debug log

        return records.map(record => ({
            id: record.id,
            tableId: record.get('Table'),
            time: record.get('DateandTime'),
            status: record.get('Reservation Type') === 'Phone call' ? 'phone-call' : 'walk-in' as Status,
            customerName: record.get('Notes'),
            pax: record.get('Pax'),
            reservationType: record.get('Reservation Type') === 'Phone call' ? 'phone' : 'walk-in'
        }));
    } catch (error) {
        console.error('Error fetching reservations:', error);
        return [];
    }
};

// Add function to update reservation status
const updateReservationStatus = async (recordId: string, status: Status) => {
    try {
        await base('Reservations').update(recordId, {
            'Status': status,
            'Reservation Type': 'Phone call'
        });
    } catch (error) {
        console.error('Error updating reservation:', error);
    }
};

const generateTimeSlots = (): TimeSlot[] => {
    const slots = [];
    for (let hour = 9; hour <= 21; hour++) {
        slots.push({
            time: `${hour.toString().padStart(2, '0')}:00 - ${(hour + 1).toString().padStart(2, '0')}:00`,
            status: 'available' as Status
        });
    }
    return slots;
};

const initialTables: Table[] = Array.from({ length: 10 }, (_, i) => ({
    id: (i + 1).toString(),
    name: `Table ${i + 1}`,
    timeSlots: generateTimeSlots()
}));

const FloorPlan = () => {
    const [tables, setTables] = useState<Table[]>(initialTables);
    const [currentDate, setCurrentDate] = useState<string>('');
    const [currentTime, setCurrentTime] = useState<string>('');

    const resetTablesDaily = () => {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const timeUntilMidnight = tomorrow.getTime() - now.getTime();
        
        setTimeout(() => {
            setTables(initialTables);
            resetTablesDaily();
        }, timeUntilMidnight);
    };

    useEffect(() => {
        resetTablesDaily();
    }, []);

    useEffect(() => {
        const updateDateTime = () => {
            const now = new Date();
            setCurrentDate(format(now, 'EEEE, MMMM d, yyyy'));
            setCurrentTime(format(now, 'hh:mm:ss a'));
        };

        updateDateTime();
        const timer = setInterval(updateDateTime, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchAndUpdateReservations = async () => {
            try {
                const reservations = await getReservations();
                if (reservations.length > 0) {
                    setTables(prevTables => prevTables.map(table => {
                        const tableReservations = reservations.filter(
                            res => res.tableId === table.name || res.tableId === `Table ${table.id}`
                        );
                        return {
                            ...table,
                            timeSlots: table.timeSlots.map(slot => {
                                const reservation = tableReservations.find(res => {
                                    if (!res.time || typeof res.time !== 'string') return false;
                                    const resDate = new Date(res.time);
                                    const slotTime = slot.time.split(' - ')[0];
                                    const [hours] = slotTime.split(':');
                                    return resDate.getHours() === parseInt(hours);
                                });

                                if (reservation) {
                                    return {
                                        ...slot,
                                        status: reservation.status as Status,
                                        reservationType: (reservation.reservationType === 'Phone call' ? 'phone' : 'walk-in') as ReservationType,
                                        customerName: String(reservation.customerName || ''),
                                        pax: Number(reservation.pax || 0)
                                    };
                                }
                                return slot;
                            })
                        };
                    }));
                }
            } catch (error) {
                console.error('Error updating tables:', error);
            }
        };

        fetchAndUpdateReservations();
        const interval = setInterval(fetchAndUpdateReservations, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const handleStatusChange = async (
        tableId: string, 
        timeSlot: string, 
        newStatus: Status, 
        reservationType: ReservationType
    ) => {
        try {
            // Update local state
            setTables(prevTables => prevTables.map(table => {
                if (table.id === tableId) {
                    return {
                        ...table,
                        timeSlots: table.timeSlots.map(slot => {
                            if (slot.time === timeSlot) {
                                return { ...slot, status: newStatus, reservationType };
                            }
                            return slot;
                        })
                    };
                }
                return table;
            }));

            // Create walk-in reservation
            if (newStatus === 'walk-in') {
                const [startTime] = timeSlot.split(' - ');
                const [hours, minutes] = startTime.split(':');
                
                const today = new Date();
                const dateTime = new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    today.getDate(),
                    parseInt(hours),
                    parseInt(minutes)
                );

                const walkInData = {
                    fields: {
                        "Table": `Table ${tableId}`,
                        "DateandTime": dateTime.toISOString(),
                        "Status": "Walk in",
                        "Reservation Type": "Google Sheet"
                    }
                };

                await base('Reservation').create([walkInData]);
            }
        } catch (error) {
            console.error('Detailed error:', error);
            throw error;
        }
    };

    return (
        <Container fluid>
            <div className="position-sticky top-0 bg-white shadow-sm py-3 mb-4" style={{ zIndex: 1000 }}>
                <Row className="align-items-center">
                    <Col>
                        <h1 className="display-4 mb-0">Restaurant Floor Plan</h1>
                        <div className="d-flex gap-4 mt-2">
                            <h5 className="mb-0 text-primary">
                                <i className="bi bi-clock me-2"></i>
                                {currentTime}
                            </h5>
                            <h5 className="mb-0 text-secondary">
                                <i className="bi bi-calendar me-2"></i>
                                {currentDate}
                            </h5>
                        </div>
                    </Col>
                </Row>
            </div>

            <div className="table-grid">
                <Row>
                    {tables.map(table => (
                        <Col key={table.id} lg={3} md={4} sm={6} className="mb-4">
                            <TableTimeSlots 
                                table={table}
                                onStatusChange={handleStatusChange}
                            />
                        </Col>
                    ))}
                </Row>
            </div>

            <style jsx global>{`
                .table-grid {
                    max-height: calc(100vh - 120px);
                    overflow-y: auto;
                    padding: 1rem;
                }

                .table-grid::-webkit-scrollbar {
                    width: 8px;
                }

                .table-grid::-webkit-scrollbar-track {
                    background: #f1f1f1;
                }

                .table-grid::-webkit-scrollbar-thumb {
                    background: #888;
                    border-radius: 4px;
                }

                .table-grid::-webkit-scrollbar-thumb:hover {
                    background: #555;
                }

                @media (max-width: 768px) {
                    .table-grid {
                        max-height: calc(100vh - 100px);
                    }
                }
            `}</style>
        </Container>
    );
};

export default FloorPlan;