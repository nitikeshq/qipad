import crypto from 'crypto';
import axios from 'axios';

export interface PayUMoneyPaymentData {
  amount: number | string;
  productInfo: string;
  firstName: string;
  email: string;
  phone?: string;
  txnId: string;
  successUrl: string;
  failureUrl: string;
  userId: string;
  paymentType: 'subscription' | 'support' | 'investment' | 'company_creation' | 'bidding_fee';
  metadata?: any;
}

export interface PayUMoneyResponse {
  success: boolean;
  paymentUrl?: string;
  txnId?: string;
  error?: string;
  formData?: any;
}

export class PayUMoneyService {
  private merchantId: string;
  private merchantKey: string;
  private salt: string;
  private baseUrl: string;

  constructor() {
    this.merchantId = process.env.PAYUMONEY_MERCHANT_ID!;
    this.merchantKey = process.env.PAYUMONEY_MERCHANT_KEY!;
    this.salt = process.env.PAYUMONEY_SALT!;
    this.baseUrl = 'https://secure.payu.in'; // Live PayUMoney URL
    
    if (!this.merchantId || !this.merchantKey || !this.salt) {
      throw new Error('PayUMoney credentials not configured');
    }
  }

  generateHash(data: PayUMoneyPaymentData): string {
    const hashString = `${this.merchantKey}|${data.txnId}|${data.amount}|${data.productInfo}|${data.firstName}|${data.email}|||||||||||${this.salt}`;
    return crypto.createHash('sha512').update(hashString).digest('hex');
  }

  verifyHash(txnId: string, amount: number, productInfo: string, firstName: string, email: string, status: string, hash: string): boolean {
    const hashString = `${this.salt}|${status}|||||||||||${email}|${firstName}|${productInfo}|${amount}|${txnId}|${this.merchantKey}`;
    const expectedHash = crypto.createHash('sha512').update(hashString).digest('hex');
    return hash.toLowerCase() === expectedHash.toLowerCase();
  }

  async createPayment(data: PayUMoneyPaymentData): Promise<PayUMoneyResponse> {
    try {
      console.log('PayUMoney createPayment - Input data:', JSON.stringify(data, null, 2));
      
      // Validate and format amount for PayUMoney
      let amount = typeof data.amount === 'string' ? parseFloat(data.amount) : Number(data.amount);
      console.log('PayUMoney - Parsed amount:', amount, 'Type:', typeof amount);
      
      if (isNaN(amount) || amount <= 0 || !isFinite(amount)) {
        console.error('PayUMoney - Invalid amount validation failed:', amount);
        return {
          success: false,
          error: 'Invalid amount: Amount must be a positive number',
        };
      }

      // Round to avoid floating point issues
      amount = Math.round(amount * 100) / 100;

      // PayUMoney minimum amount is ₹10
      if (amount < 10) {
        console.error('PayUMoney - Amount below minimum:', amount);
        return {
          success: false,
          error: 'Minimum amount is ₹10 for PayUMoney payments',
        };
      }

      // Format amount to exactly 2 decimal places (PayUMoney requirement)
      const formattedAmount = amount.toFixed(2);
      console.log('PayUMoney - Formatted amount:', formattedAmount);
      
      const paymentDataForHash = { ...data, amount: formattedAmount };
      const hash = this.generateHash(paymentDataForHash);
      console.log('PayUMoney - Generated hash:', hash.substring(0, 20) + '...');
      
      const paymentData = {
        key: this.merchantKey,
        txnid: data.txnId,
        amount: formattedAmount,
        productinfo: data.productInfo,
        firstname: data.firstName,
        email: data.email,
        phone: data.phone || '',
        surl: data.successUrl,
        furl: data.failureUrl,
        hash: hash,
        service_provider: 'payu_paisa',
        udf1: data.userId || '',
        udf2: data.paymentType || '',
        udf3: JSON.stringify(data.metadata || {}),
        udf4: '',
        udf5: '',
        pg: 'CC', // Credit Card as default payment gateway
      };

      console.log('PayUMoney - Final payment data:', {
        ...paymentData,
        hash: hash.substring(0, 20) + '...',
        key: this.merchantKey.substring(0, 10) + '...'
      });

      // For PayUMoney, we need to redirect to their payment page
      const paymentUrl = `${this.baseUrl}/_payment`;
      
      return {
        success: true,
        paymentUrl,
        txnId: data.txnId,
        formData: paymentData, // Return form data for frontend to POST
      };
    } catch (error) {
      console.error('PayUMoney payment creation failed:', error);
      return {
        success: false,
        error: 'Failed to create payment',
      };
    }
  }

  generateTxnId(): string {
    return `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async processCallback(callbackData: any): Promise<{ success: boolean; txnId: string; status: string; amount: number; error?: string }> {
    try {
      const { txnid, amount, firstname, email, productinfo, status, hash } = callbackData;
      
      // Verify hash
      const isValidHash = this.verifyHash(txnid, amount, productinfo, firstname, email, status, hash);
      
      if (!isValidHash) {
        return {
          success: false,
          txnId: txnid,
          status: 'failed',
          amount: parseFloat(amount),
          error: 'Invalid hash verification'
        };
      }

      return {
        success: status === 'success',
        txnId: txnid,
        status,
        amount: parseFloat(amount),
      };
    } catch (error) {
      console.error('PayUMoney callback processing failed:', error);
      return {
        success: false,
        txnId: '',
        status: 'failed',
        amount: 0,
        error: 'Callback processing failed'
      };
    }
  }
}

export const payumoneyService = new PayUMoneyService();