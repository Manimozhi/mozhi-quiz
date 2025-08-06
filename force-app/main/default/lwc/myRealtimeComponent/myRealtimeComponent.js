import { LightningElement, api } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import { ShowToastEvent } from 'lightning/platformShowToastEvent'; // For displaying messages
import SOCKETIO_CLIENT from '@salesforce/resourceUrl/socketio';

export default class MyRealtimeComponent extends LightningElement {
    @api recordId; // Automatically populated with the current record's ID
    @api utilityTitle;

    socketInitialized = false;
    socket = null;
    messages = []; // To store received messages

    // Input properties for the calculator
    firstOperand = 0;
    secondOperand = 0;
    operation = 'ADD'; // Default operation

    // Options for the operation combobox
    operationOptions = [
        { label: 'Add', value: 'ADD' },
        { label: 'Subtract', value: 'SUBTRACT' },
    ];

    connectedCallback() {
        if (!this.socketInitialized) {
            this.socketInitialized = true;
            Promise.all([
                loadScript(this, SOCKETIO_CLIENT)
            ])
            .then(() => {
                this.initializeSocketIo();
            })
            .catch(error => {
                console.error('Error loading Socket.IO library', error);
                this.showToast('Error', 'Failed to load Socket.IO library: ' + error.message, 'error');
            });
        }
    }

    initializeSocketIo() {
        // Replace with the URL of your intermediary Socket.IO server
        // IMPORTANT: This URL must be added to CSP Trusted Sites in Salesforce Setup
        const serverUrl = 'https://grpc-intermediary-service-284810888760.us-central1.run.app'; 

        this.socket = io(serverUrl);

        this.socket.on('connect', () => {
            console.log('Connected to Socket.IO server!');
            this.messages.push('Connected to real-time service.');
            console.log('Component is on Record ID:', this.recordId);
            this.showToast('Success', 'Connected to real-time service!', 'success');
        });

        this.socket.on('calculationResult', (data) => {
            console.log('Received calculation result:', data);
            this.messages.push(`[${data.timestamp.substring(11, 19)}] ${data.firstOperand} ${data.operation} ${data.secondOperand} = ${data.result}`);
            // You can update your LWC properties here to display the data
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from Socket.IO server.');
            this.messages.push('Disconnected from real-time service.');
            this.showToast('Warning', 'Disconnected from real-time service.', 'warning');
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket.IO connection error:', error);
            this.messages.push(`Connection error: ${error.message}`);
            this.showToast('Error', 'Socket.IO connection error: ' + error.message, 'error');
        });
    }

    // Handlers for input changes
    handleFirstOperandChange(event) {
        this.firstOperand = parseFloat(event.target.value);
    }

    handleSecondOperandChange(event) {
        this.secondOperand = parseFloat(event.target.value);
    }

    handleOperationChange(event) {
        this.operation = event.detail.value;
    }

    // Method to send calculation request to the intermediary service
    performCalculation() {
        if (!this.socket) {
            this.showToast('Error', 'Not connected to real-time service.', 'error');
            return;
        }

        // Emit a custom event to the Socket.IO server with calculation data
        // The intermediary service's Socket.IO server should listen for 'performCalculation'
        // and then make the gRPC call.
        const calculationData = {
            first_operand: this.firstOperand,
            second_operand: this.secondOperand,
            operation: this.operation,
            // You might include recordId if the calculation is context-specific
            recordId: this.recordId 
        };

        this.socket.emit('performCalculation', calculationData);
        console.log('Sent calculation request:', calculationData);
        this.messages.push(`Sending: ${this.firstOperand} ${this.operation} ${this.secondOperand}...`);
    }

    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        });
        this.dispatchEvent(event);
    }
}
