import { ReservationType } from '@/types';
import Airtable from 'airtable';

const base = new Airtable({
    apiKey: 'patSM7srrQNAGryRf.b044624fb90f100f1f4bd7efda8f40f4176863ef1b9206aeeff78e2e6437f2e9'  // Replace with your actual API key
}).base('appuI5cRKzcI7c86H');

export const getReservations = async () => {
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
    
    try {
        const records = await base('Reservation')
            .select({
                filterByFormula: `AND(
                    IS_SAME({date}, TODAY()),
                    {status} != 'cancelled'
                )`
            })
            .all();

        return records.map(record => ({
            id: record.id,
            tableId: record.get('Table'),
            time: record.get('DateandTime'),
            status: record.get('Reservation Type') === 'Phone call' ? 'phone-call' : 'walk-in' as ReservationType,
            customerName: record.get('Notes'),
            pax: record.get('Pax'),
            reservationType: record.get('Reservation Type') === 'Phone call' ? 'phone' : 'walk-in'
        }));
    } catch (error) {
        console.error('Error fetching reservations:', error);
        return [];
    }
};