// routes/seed.js
// POST /api/seed — database mein sample products add karo
// Sirf ek baar run karna hai!
 
const express      = require('express')
const { PrismaClient } = require('@prisma/client')
 
const router = express.Router()
const prisma = new PrismaClient()   // ← yeh line zaroori hai!
 
const sampleProducts = [
  { name:'Paracetamol 500mg',   brand:'PharmaCo',    pack:'Strip of 10 tablets',       price:2.49,  oldPrice:null,  category:'prescription', badge:'rx',   bg:'#eff6ff', st:'#3b82f6', stock:200 },
  { name:'Ibuprofen 400mg',     brand:'MediGen',     pack:'Strip of 15 tablets',       price:3.99,  oldPrice:5.49,  category:'prescription', badge:'sale', bg:'#fee2e2', st:'#dc2626', stock:150 },
  { name:'Amoxicillin 500mg',   brand:'CureGen',     pack:'Strip of 10 capsules',      price:6.49,  oldPrice:null,  category:'prescription', badge:'rx',   bg:'#eff6ff', st:'#3b82f6', stock:100 },
  { name:'Metformin 500mg',     brand:'DiaCare',     pack:'30 tablets',                price:4.99,  oldPrice:6.99,  category:'prescription', badge:'sale', bg:'#eff6ff', st:'#3b82f6', stock:120 },
  { name:'Vitamin C 1000mg',    brand:'VitaPlus',    pack:'60 effervescent tabs',      price:8.99,  oldPrice:11.99, category:'vitamins',     badge:'sale', bg:'#fef3c7', st:'#d97706', stock:300 },
  { name:'Vitamin D3 2000IU',   brand:'SunHealth',   pack:'90 softgel capsules',       price:12.49, oldPrice:null,  category:'vitamins',     badge:null,   bg:'#fef3c7', st:'#d97706', stock:250 },
  { name:'Omega-3 Fish Oil',    brand:'OceanCare',   pack:'60 capsules',               price:14.99, oldPrice:18.99, category:'vitamins',     badge:'sale', bg:'#fef3c7', st:'#d97706', stock:180 },
  { name:'Moisturizing Cream',  brand:'DermaCare',   pack:'200ml tube',                price:14.99, oldPrice:19.99, category:'skincare',     badge:'sale', bg:'#fce7f3', st:'#db2777', stock:90  },
  { name:'SPF 50+ Sunscreen',   brand:'SkinShield',  pack:'100ml spray',               price:18.99, oldPrice:null,  category:'skincare',     badge:null,   bg:'#fce7f3', st:'#db2777', stock:75  },
  { name:'Digital Thermometer', brand:'MediTech',    pack:'Fast read, waterproof',     price:14.99, oldPrice:null,  category:'devices',      badge:null,   bg:'#eff6ff', st:'#3b82f6', stock:60  },
  { name:'Blood Pressure Monitor', brand:'CardioCheck', pack:'Automatic, arm cuff',   price:49.99, oldPrice:64.99, category:'devices',      badge:'sale', bg:'#eff6ff', st:'#3b82f6', stock:40  },
  { name:'Pulse Oximeter',      brand:'OxyMed',      pack:'Fingertip with display',    price:19.99, oldPrice:null,  category:'devices',      badge:null,   bg:'#eff6ff', st:'#3b82f6', stock:55  },
  { name:'First Aid Kit 42-pc', brand:'SafeKit',     pack:'Complete family kit',       price:19.99, oldPrice:23.99, category:'firstaid',     badge:'sale', bg:'#ede9fe', st:'#7c3aed', stock:80  },
  { name:'Antiseptic Solution', brand:'CleanGuard',  pack:'500ml bottle',              price:5.99,  oldPrice:null,  category:'firstaid',     badge:null,   bg:'#ede9fe', st:'#7c3aed', stock:200 },
  { name:'Baby Vitamin Drops',  brand:'TinyHealth',  pack:'30ml dropper',              price:9.99,  oldPrice:null,  category:'baby',         badge:null,   bg:'#fef3c7', st:'#d97706', stock:70  },
  { name:'Baby Diaper Cream',   brand:'SoftCare',    pack:'100g tube',                 price:7.49,  oldPrice:9.99,  category:'baby',         badge:'sale', bg:'#fce7f3', st:'#db2777', stock:110 },
  { name:'Protein Powder',      brand:'NutriMax',    pack:'1kg vanilla pouch',         price:34.99, oldPrice:44.99, category:'nutrition',    badge:'sale', bg:'#eff6ff', st:'#3b82f6', stock:65  },
  { name:'Multivitamin Gummies',brand:'GummiHealth', pack:'60 gummies',                price:12.99, oldPrice:null,  category:'nutrition',    badge:null,   bg:'#fef3c7', st:'#d97706', stock:140 },
]
 
router.post('/', async (req, res) => {
  try {
    // Check kitne products already hain
    const count = await prisma.product.count()
 
    if (count > 0) {
      return res.status(200).json({
        message: `Already seeded! ${count} products already exist in database.`
      })
    }
 
    // Saare products ek saath insert karo
    const result = await prisma.product.createMany({
      data: sampleProducts
    })
 
    return res.status(201).json({
      message: `✅ ${result.count} products successfully added to database!`
    })
 
  } catch (error) {
    console.error('Seed error:', error.message)
    return res.status(500).json({
      error: 'Seed failed: ' + error.message
    })
  }
})
 
module.exports = router