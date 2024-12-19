export type ReservationType = 'walk-in' | 'online' | 'phone';
export type Status = 'available' | 'phone-call' | 'walk-in';

export interface TimeSlot {
    time: string;
    status: Status;
    reservationType?: ReservationType;
    customerName?: string;
    pax?: number;
}

export interface Table {
    id: string;
    name: string;
    timeSlots: TimeSlot[];
} 