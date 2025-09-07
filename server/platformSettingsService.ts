import { storage } from "./storage";

export class PlatformSettingsService {
  private static cache: Map<string, { value: string; cachedAt: number }> = new Map();
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static async getPlatformFeePercentage(): Promise<number> {
    const setting = await this.getSetting('platform_fee_percentage');
    return setting ? parseFloat(setting) / 100 : 0.05; // Default 5% if not set
  }

  static async getSetting(key: string): Promise<string | null> {
    // Check cache first
    const cached = this.cache.get(key);
    const now = Date.now();
    
    if (cached && now - cached.cachedAt < this.CACHE_TTL) {
      return cached.value;
    }

    try {
      const setting = await storage.getPlatformSetting(key);
      const value = setting?.value || null;
      
      // Cache the result
      if (value !== null) {
        this.cache.set(key, { value, cachedAt: now });
      }
      
      return value;
    } catch (error) {
      console.error(`Error fetching platform setting ${key}:`, error);
      return null;
    }
  }

  static async initializeDefaultSettings(): Promise<void> {
    try {
      // Check if platform_fee_percentage exists, if not create it
      const feePercentage = await storage.getPlatformSetting('platform_fee_percentage');
      if (!feePercentage) {
        await storage.setPlatformSetting(
          'platform_fee_percentage',
          '5.0',
          'Platform fee percentage charged on successful transactions (includes payment gateway fees)',
          'fees'
        );
      }

      // Add other default settings as needed
      const maxInvestmentAmount = await storage.getPlatformSetting('max_investment_amount');
      if (!maxInvestmentAmount) {
        await storage.setPlatformSetting(
          'max_investment_amount',
          '10000000',
          'Maximum investment amount allowed per transaction (in rupees)',
          'limits'
        );
      }

      const minInvestmentAmount = await storage.getPlatformSetting('min_investment_amount');
      if (!minInvestmentAmount) {
        await storage.setPlatformSetting(
          'min_investment_amount',
          '1000',
          'Minimum investment amount required per transaction (in rupees)',
          'limits'
        );
      }

    } catch (error) {
      // Silently handle table not existing yet - will be created when schema is pushed
      if (error.code !== '42P01') { // Only log if it's not a "relation does not exist" error
        console.error('Error initializing default platform settings:', error);
      }
    }
  }

  static clearCache(): void {
    this.cache.clear();
  }

  static invalidateSetting(key: string): void {
    this.cache.delete(key);
  }
}