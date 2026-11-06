import University from '../models/University.js';
import Category from '../models/Category.js';
import User from '../models/User.js';

export const initialUniversities = [
  // Top Indian Universities & Institutes
  {
    name: 'Indian Institute of Technology Bombay (IIT Bombay)',
    code: 'IITB',
    domain: 'iitb.ac.in',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    campuses: ['Powai Campus'],
    isActive: true,
  },
  {
    name: 'Indian Institute of Technology Delhi (IIT Delhi)',
    code: 'IITD',
    domain: 'iitd.ac.in',
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    campuses: ['Hauz Khas Campus', 'Sonipat Campus'],
    isActive: true,
  },
  {
    name: 'Indian Institute of Technology Madras (IIT Madras)',
    code: 'IITM',
    domain: 'iitm.ac.in',
    city: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
    campuses: ['Main Campus', 'Discovery Campus'],
    isActive: true,
  },
  {
    name: 'Indian Institute of Technology Kanpur (IIT Kanpur)',
    code: 'IITK',
    domain: 'iitk.ac.in',
    city: 'Kanpur',
    state: 'Uttar Pradesh',
    country: 'India',
    campuses: ['Kalyanpur Campus'],
    isActive: true,
  },
  {
    name: 'Indian Institute of Technology Kharagpur (IIT Kharagpur)',
    code: 'IITKGP',
    domain: 'iitkgp.ac.in',
    city: 'Kharagpur',
    state: 'West Bengal',
    country: 'India',
    campuses: ['Main Campus', 'Kolkata Campus'],
    isActive: true,
  },
  {
    name: 'Indian Institute of Technology Roorkee (IIT Roorkee)',
    code: 'IITR',
    domain: 'iitr.ac.in',
    city: 'Roorkee',
    state: 'Uttarakhand',
    country: 'India',
    campuses: ['Roorkee Campus'],
    isActive: true,
  },
  {
    name: 'Indian Institute of Science (IISc Bangalore)',
    code: 'IISC',
    domain: 'iisc.ac.in',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    campuses: ['Main Campus'],
    isActive: true,
  },
  {
    name: 'Birla Institute of Technology and Science (BITS Pilani)',
    code: 'BITSP',
    domain: 'bits-pilani.ac.in',
    city: 'Pilani',
    state: 'Rajasthan',
    country: 'India',
    campuses: ['Pilani Campus', 'Goa Campus', 'Hyderabad Campus'],
    isActive: true,
  },
  {
    name: 'University of Delhi (Delhi University)',
    code: 'DU',
    domain: 'du.ac.in',
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    campuses: ['North Campus', 'South Campus'],
    isActive: true,
  },
  {
    name: 'Vellore Institute of Technology (VIT)',
    code: 'VIT',
    domain: 'vit.ac.in',
    city: 'Vellore',
    state: 'Tamil Nadu',
    country: 'India',
    campuses: ['Vellore Campus', 'Chennai Campus', 'Bhopal Campus', 'AP Campus'],
    isActive: true,
  },
  {
    name: 'Manipal Academy of Higher Education (MAHE)',
    code: 'MANIPAL',
    domain: 'manipal.edu',
    city: 'Manipal',
    state: 'Karnataka',
    country: 'India',
    campuses: ['Manipal Campus', 'Bengaluru Campus', 'Mangalore Campus'],
    isActive: true,
  },
  {
    name: 'National Institute of Technology Tiruchirappalli (NIT Trichy)',
    code: 'NITT',
    domain: 'nitt.edu',
    city: 'Tiruchirappalli',
    state: 'Tamil Nadu',
    country: 'India',
    campuses: ['Thuvakudi Campus'],
    isActive: true,
  },
  {
    name: 'National Institute of Technology Karnataka (NIT Surathkal)',
    code: 'NITK',
    domain: 'nitk.ac.in',
    city: 'Surathkal',
    state: 'Karnataka',
    country: 'India',
    campuses: ['Srinivasnagar Campus'],
    isActive: true,
  },
  {
    name: 'Banaras Hindu University (BHU)',
    code: 'BHU',
    domain: 'bhu.ac.in',
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    country: 'India',
    campuses: ['Main Campus', 'South Campus'],
    isActive: true,
  },
  {
    name: 'Jawaharlal Nehru University (JNU)',
    code: 'JNU',
    domain: 'jnu.ac.in',
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    campuses: ['New Mehrauli Campus'],
    isActive: true,
  },
  {
    name: 'Anna University',
    code: 'ANNA',
    domain: 'annauniv.edu',
    city: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
    campuses: ['Guindy Campus', 'Chromepet Campus'],
    isActive: true,
  },
  {
    name: 'Jadavpur University',
    code: 'JU',
    domain: 'jadavpuruniversity.in',
    city: 'Kolkata',
    state: 'West Bengal',
    country: 'India',
    campuses: ['Main Campus', 'Salt Lake Campus'],
    isActive: true,
  },
  {
    name: 'Amity University',
    code: 'AMITY',
    domain: 'amity.edu',
    city: 'Noida',
    state: 'Uttar Pradesh',
    country: 'India',
    campuses: ['Noida Campus', 'Lucknow Campus', 'Gurugram Campus', 'Mumbai Campus'],
    isActive: true,
  },
  {
    name: 'SRM Institute of Science and Technology',
    code: 'SRM',
    domain: 'srmist.edu.in',
    city: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
    campuses: ['Kattankulathur Campus', 'Ramapuram Campus'],
    isActive: true,
  },
  {
    name: 'Thapar Institute of Engineering and Technology',
    code: 'TIET',
    domain: 'thapar.edu',
    city: 'Patiala',
    state: 'Punjab',
    country: 'India',
    campuses: ['Patiala Campus'],
    isActive: true,
  },

  // International Universities
  {
    name: 'Stanford University',
    code: 'STANFORD',
    domain: 'stanford.edu',
    city: 'Stanford',
    state: 'California',
    country: 'United States',
    campuses: ['Main Campus', 'Redwood City'],
    isActive: true,
  },
  {
    name: 'Massachusetts Institute of Technology',
    code: 'MIT',
    domain: 'mit.edu',
    city: 'Cambridge',
    state: 'Massachusetts',
    country: 'United States',
    campuses: ['Cambridge Campus'],
    isActive: true,
  },
  {
    name: 'University of California, Berkeley',
    code: 'UCB',
    domain: 'berkeley.edu',
    city: 'Berkeley',
    state: 'California',
    country: 'United States',
    campuses: ['Central Campus', 'Clark Kerr'],
    isActive: true,
  },
  {
    name: 'Harvard University',
    code: 'HARVARD',
    domain: 'harvard.edu',
    city: 'Cambridge',
    state: 'Massachusetts',
    country: 'United States',
    campuses: ['Harvard Yard', 'Allston', 'Longwood'],
    isActive: true,
  },
  {
    name: 'University of Washington',
    code: 'UW',
    domain: 'uw.edu',
    city: 'Seattle',
    state: 'Washington',
    country: 'United States',
    campuses: ['Seattle Campus', 'Bothell', 'Tacoma'],
    isActive: true,
  },
  {
    name: 'University of Texas at Austin',
    code: 'UTEXAS',
    domain: 'utexas.edu',
    city: 'Austin',
    state: 'Texas',
    country: 'United States',
    campuses: ['Main Campus', 'Pickle Research Campus'],
    isActive: true,
  },
];

export const initialCategories = [
  {
    name: 'Computer Science & Engineering',
    slug: 'computer-science-engineering',
    description: 'Algorithms, Software Engineering, AI, Systems, and Data Structures.',
    icon: 'laptop',
    isActive: true,
  },
  {
    name: 'Mathematics & Statistics',
    slug: 'mathematics-statistics',
    description: 'Calculus, Linear Algebra, Probability, Statistics, and Discrete Math.',
    icon: 'percent',
    isActive: true,
  },
  {
    name: 'Physics & Astronomy',
    slug: 'physics-astronomy',
    description: 'Classical Mechanics, Electromagnetism, Quantum Physics, and Optics.',
    icon: 'atom',
    isActive: true,
  },
  {
    name: 'Biology & Life Sciences',
    slug: 'biology-life-sciences',
    description: 'Genetics, Molecular Biology, Biochemistry, and Physiology.',
    icon: 'dna',
    isActive: true,
  },
  {
    name: 'Business & Economics',
    slug: 'business-economics',
    description: 'Finance, Marketing, Macroeconomics, Management, and Accounting.',
    icon: 'trending-up',
    isActive: true,
  },
  {
    name: 'Literature & Humanities',
    slug: 'literature-humanities',
    description: 'Philosophy, History, Classical Literature, and Writing.',
    icon: 'book-open',
    isActive: true,
  },
  {
    name: 'Medicine & Healthcare',
    slug: 'medicine-healthcare',
    description: 'Anatomy, Pharmacology, Pathology, and Nursing Essentials.',
    icon: 'activity',
    isActive: true,
  },
  {
    name: 'Law & Political Science',
    slug: 'law-political-science',
    description: 'Constitutional Law, International Relations, and Jurisprudence.',
    icon: 'scale',
    isActive: true,
  },
  {
    name: 'Chemistry & Chemical Engineering',
    slug: 'chemistry-chemical-engineering',
    description: 'Organic Chemistry, Thermodynamics, and Reaction Kinetics.',
    icon: 'flask-conical',
    isActive: true,
  },
  {
    name: 'Arts & Architecture',
    slug: 'arts-architecture',
    description: 'Design Theory, Architectural Drafting, and Visual Arts.',
    icon: 'palette',
    isActive: true,
  },
];

/**
 * Ensures universities and categories exist in the database.
 * If none exist, seeds the initial list.
 * If some exist, inserts any missing Indian universities so they are always available.
 */
export async function ensureInitialData() {
  try {
    const uniCount = await University.countDocuments();
    if (uniCount === 0) {
      await University.insertMany(initialUniversities);
      console.log(`✅ Seeded ${initialUniversities.length} universities.`);
    } else {
      // Check if Indian universities are present; insert missing ones
      for (const uni of initialUniversities) {
        const exists = await University.findOne({ code: uni.code });
        if (!exists) {
          await University.create(uni);
        }
      }
    }

    const catCount = await Category.countDocuments();
    if (catCount === 0) {
      await Category.insertMany(initialCategories);
      console.log(`✅ Seeded ${initialCategories.length} categories.`);
    } else {
      for (const cat of initialCategories) {
        const exists = await Category.findOne({ slug: cat.slug });
        if (!exists) {
          await Category.create(cat);
        }
      }
    }

    // Ensure at least one admin account exists
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      const adminEmail = process.env.ADMIN_EMAIL || 'ashwanip764@gmail.com';
      const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPass123!';
      await User.create({
        name: 'Ashwani Pandey (Admin)',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        isVerified: true,
        verificationStatus: 'verified',
        department: 'Platform Administration',
      });
      console.log(`✅ Initial admin account created: ${adminEmail}`);
    }
  } catch (error) {
    console.error('Warning: could not ensure initial data:', error.message);
  }
}

