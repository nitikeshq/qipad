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
    this.merchantId = process.env.PAYUMONEY_MERCHANT_ID || '';
    this.merchantKey = process.env.PAYUMONEY_MERCHANT_KEY || '';
    this.salt = process.env.PAYUMONEY_SALT || '';
    this.baseUrl = 'https://secure.payu.in'; // Live PayUMoney URL
    
    if (!this.merchantId || !this.merchantKey || !this.salt) {
      console.warn('PayUMoney credentials not configured - payment functionality will be disabled');
    }
  }

  generateHash(data: PayUMoneyPaymentData): string {
    if (!this.merchantKey || !this.salt) {
      throw new Error('PayUMoney credentials not configured');
    }
    
    // PayUMoney hash format: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT
    const udf1 = data.userId || '';
    const udf2 = data.paymentType || '';
    const udf3 = data.metadata ? JSON.stringify(data.metadata) : '';
    const udf4 = '';
    const udf5 = '';
    
    const hashString = `${this.merchantKey}|${data.txnId}|${data.amount}|${data.productInfo}|${data.firstName}|${data.email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${this.salt}`;
    console.log('PayUMoney - Hash string:', hashString.replace(this.salt, 'SALT_HIDDEN').replace(this.merchantKey, 'KEY_HIDDEN'));
    return crypto.createHash('sha512').update(hashString).digest('hex');
  }

  verifyHash(callbackData: any): boolean {
    if (!this.salt || !this.merchantKey) {
      return false;
    }
    
    // PayUMoney response hash format: SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
    const { txnid, amount, firstname, email, productinfo, status, hash, udf1, udf2, udf3, udf4, udf5 } = callbackData;
    
    const hashString = `${this.salt}|${status}||||||${udf5 || ''}|${udf4 || ''}|${udf3 || ''}|${udf2 || ''}|${udf1 || ''}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${this.merchantKey}`;
    const expectedHash = crypto.createHash('sha512').update(hashString).digest('hex');
    return hash.toLowerCase() === expectedHash.toLowerCase();
  }

  /**
   * Generate payment form following PayUMoney reference implementation
   */
  generatePaymentForm(paymentData: PayUMoneyPaymentData): {
    action: string;
    method: string;
    fields: Record<string, string>;
  } {
    if (!this.merchantKey || !this.salt || !this.merchantId) {
      throw new Error('PayUMoney credentials not configured');
    }
    // Validate and format amount
    let amount = typeof paymentData.amount === 'string' ? parseFloat(paymentData.amount) : Number(paymentData.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Invalid amount: Amount must be a positive number');
    }
    
    // Format amount to 2 decimal places
    const formattedAmount = amount.toFixed(2);
    
    // Generate hash with properly formatted data
    const hashData = { ...paymentData, amount: formattedAmount };
    const hash = this.generateHash(hashData);
    
    // Ensure HTTPS URLs for security (following reference code pattern)
    const secureSuccessUrl = paymentData.successUrl.replace('http://', 'https://');
    const secureFailureUrl = paymentData.failureUrl.replace('http://', 'https://');
    
    const fields = {
      key: this.merchantKey,
      txnid: paymentData.txnId,
      amount: formattedAmount,
      productinfo: paymentData.productInfo,
      firstname: paymentData.firstName,
      email: paymentData.email,
      phone: paymentData.phone || '',
      surl: secureSuccessUrl,
      furl: secureFailureUrl,
      hash: hash,
      udf1: paymentData.userId || '',
      udf2: paymentData.paymentType || '',
      udf3: paymentData.metadata ? JSON.stringify(paymentData.metadata) : '',
      udf4: '',
      udf5: '',
      service_provider: 'payu_paisa',
      enforce_paymethod: 'creditcard,debitcard,netbanking,upi',
      pg: 'CC,DC,NB,UPI',
      bankcode: 'CC',
      drop_category: '0',
      show_payment_mode: '1'
    };

    return {
      action: this.baseUrl + '/_payment',
      method: 'POST',
      fields
    };
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

      // Use the reference code pattern for payment form generation
      const paymentForm = this.generatePaymentForm(data);
      
      console.log('PayUMoney - Generated payment form:', {
        action: paymentForm.action,
        method: paymentForm.method,
        fields: {
          ...paymentForm.fields,
          key: paymentForm.fields.key.substring(0, 6) + '...',
          hash: paymentForm.fields.hash.substring(0, 20) + '...',
        }
      });

      return {
        success: true,
        paymentUrl: paymentForm.action,
        txnId: data.txnId,
        formData: paymentForm.fields,
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
      const { txnid, amount, status } = callbackData;
      
      // Verify hash using the corrected method
      const isValidHash = this.verifyHash(callbackData);
      
      if (!isValidHash) {
        console.error('PayUMoney - Hash verification failed for transaction:', txnid);
        return {
          success: false,
          txnId: txnid,
          status: 'failed',
          amount: parseFloat(amount),
          error: 'Invalid hash verification'
        };
      }

      console.log('PayUMoney - Hash verification successful for transaction:', txnid);
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