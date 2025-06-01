#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateExistingStrategies() {
  console.log('🔄 Updating existing strategies with margin data...');
  
  try {
    // Get all strategies to check which ones need updates
    const allStrategies = await prisma.strategy.findMany({
      select: {
        id: true,
        name: true,
        strategyType: true,
        margin: true,
        marginType: true,
        basePrice: true,
      }
    });

    // Filter strategies that need margin data updates
    const strategiesWithoutMargin = allStrategies.filter(strategy => 
      strategy.margin === null || 
      strategy.marginType === null || 
      strategy.basePrice === null ||
      strategy.margin === undefined ||
      strategy.marginType === undefined ||
      strategy.basePrice === undefined
    );

    console.log(`📊 Found ${strategiesWithoutMargin.length} strategies to update`);

    if (strategiesWithoutMargin.length === 0) {
      console.log('✅ All strategies already have margin data');
      return;
    }

    // Update each strategy with default margin values
    const updatePromises = strategiesWithoutMargin.map(async (strategy) => {
      // Set default margin based on strategy type
      let defaultMargin = 5.0; // 5% default
      let defaultBasePrice = 50000; // ₹50,000 default
      
      if (strategy.strategyType?.toLowerCase().includes('option')) {
        defaultMargin = 2500; // ₹2,500 for options
        defaultBasePrice = 50000;
      } else if (strategy.strategyType?.toLowerCase().includes('nifty')) {
        defaultMargin = 5.0; // 5% for equity
        defaultBasePrice = 24000; // NIFTY ~24,000
      }

      return prisma.strategy.update({
        where: { id: strategy.id },
        data: {
          margin: strategy.margin ?? defaultMargin,
          marginType: strategy.marginType ?? (defaultMargin > 100 ? 'rupees' : 'percentage'),
          basePrice: strategy.basePrice ?? defaultBasePrice,
        }
      });
    });

    await Promise.all(updatePromises);

    console.log(`✅ Successfully updated ${strategiesWithoutMargin.length} strategies`);
    
    // Show a sample of updated strategies
    const updatedStrategies = await prisma.strategy.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        margin: true,
        marginType: true,
        basePrice: true,
      }
    });

    console.log('\n📋 Sample updated strategies:');
    updatedStrategies.forEach(strategy => {
      const marginDisplay = strategy.marginType === 'percentage' 
        ? `${strategy.margin}%` 
        : `₹${strategy.margin}`;
      console.log(`  • ${strategy.name}: ${marginDisplay} (base: ₹${strategy.basePrice})`);
    });

  } catch (error) {
    console.error('❌ Error updating strategies:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateExistingStrategies(); 