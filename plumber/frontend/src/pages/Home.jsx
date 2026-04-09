import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './Home.css';

gsap.registerPlugin(ScrollTrigger);

const fadeUpVariant = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const Home = () => {
  const heroRef = useRef(null);
  const bgRef = useRef(null);

  useEffect(() => {
    // Parallax logic explicitly requested
    if (bgRef.current && heroRef.current) {
       gsap.to(bgRef.current, {
           yPercent: 20,
           ease: "none",
           scrollTrigger: {
               trigger: heroRef.current,
               start: "top top",
               end: "bottom top",
               scrub: true
           }
       });
    }
  }, []);

  // Split word animation generator
  const renderSplitText = (text) => {
    return text.split(' ').map((word, index) => (
      <motion.span 
        key={index} 
        style={{ display: 'inline-block', marginRight: '14px' }}
        variants={{
           hidden: { opacity: 0, y: 15 },
           visible: { opacity: 1, y: 0 }
        }}
      >
        {word}
      </motion.span>
    ));
  };

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section" ref={heroRef}>
        <div className="parallax-bg" ref={bgRef}></div>
        <motion.div 
           className="hero-content"
           variants={staggerContainer}
           initial="hidden"
           animate="visible"
        >
          <motion.h1 className="hero-title" variants={staggerContainer}>
            {renderSplitText("Professional Plumbing Services,")}
            <br/>
            <motion.span className="highlight" variants={fadeUpVariant}>
               When You Need Them Most.
            </motion.span>
          </motion.h1>
          <motion.p className="hero-description" variants={fadeUpVariant}>
            Connect instantly with verified, top-tier plumbing professionals for reliable installations, emergency repairs, and thorough maintenance.
          </motion.p>
          <motion.div className="hero-actions" variants={fadeUpVariant}>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
               <Link to="/booking" className="btn-primary hero-btn">Book Now</Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
               <Link to="/plumbers" className="btn-outline hero-btn">Browse Experts</Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Trust Badges */}
      <motion.section 
         className="trust-badges"
         variants={staggerContainer}
         initial="hidden"
         whileInView="visible"
         viewport={{ once: true, margin: "-80px" }}
      >
        <motion.div className="badge" variants={fadeUpVariant}>✓ Licensed & Insured</motion.div>
        <motion.div className="badge" variants={fadeUpVariant}>✓ Upfront Pricing</motion.div>
        <motion.div className="badge" variants={fadeUpVariant}>✓ 24/7 Support</motion.div>
      </motion.section>

      {/* Services Section */}
      <section className="services-section">
        <motion.h2 
           className="section-title"
           initial="hidden"
           whileInView="visible"
           viewport={{ once: true, margin: "-80px" }}
           variants={fadeUpVariant}
        >
           Our Capabilities
        </motion.h2>
        
        <motion.div 
           className="services-grid"
           variants={staggerContainer}
           initial="hidden"
           whileInView="visible"
           viewport={{ once: true, margin: "-80px" }}
        >
          <motion.div className="card-panel service-card" variants={fadeUpVariant} whileHover={{ y: -6, boxShadow: "0 20px 60px rgba(0,0,0,0.12)" }}>
             <motion.div className="service-icon" whileHover={{ rotate: 5, transition: { duration: 0.3 } }}>💧</motion.div>
             <h3>Leak Repair</h3>
             <p>Fast, reliable detection and sealing of pipe leaks minimizing structural water damage.</p>
          </motion.div>
          <motion.div className="card-panel service-card" variants={fadeUpVariant} whileHover={{ y: -6, boxShadow: "0 20px 60px rgba(0,0,0,0.12)" }}>
             <motion.div className="service-icon" whileHover={{ rotate: 5, transition: { duration: 0.3 } }}>🔧</motion.div>
             <h3>Pipe Installation</h3>
             <p>High-end structural pipe laying for remodels, new builds, and commercial venues.</p>
          </motion.div>
          <motion.div className="card-panel service-card" variants={fadeUpVariant} whileHover={{ y: -6, boxShadow: "0 20px 60px rgba(0,0,0,0.12)" }}>
             <motion.div className="service-icon" whileHover={{ rotate: 5, transition: { duration: 0.3 } }}>🌀</motion.div>
             <h3>Drain Cleaning</h3>
             <p>Advanced snake and hydro-jetting services to clear severe blockages permanently.</p>
          </motion.div>
        </motion.div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <motion.h2 
            className="section-title"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeUpVariant}
        >
            Client Experiences
        </motion.h2>
        
        <motion.div 
            className="testimonials-grid"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
        >
           <motion.div className="card-panel testimonial-card" variants={fadeUpVariant} whileHover={{ y: -6, boxShadow: "0 20px 60px rgba(0,0,0,0.12)" }}>
             <div className="stars">★★★★★</div>
             <p>"The plumber arrived in 20 minutes and fixed our burst pipe flawlessly. Highly recommended!"</p>
             <h4>- Sarah J.</h4>
           </motion.div>
           <motion.div className="card-panel testimonial-card" variants={fadeUpVariant} whileHover={{ y: -6, boxShadow: "0 20px 60px rgba(0,0,0,0.12)" }}>
             <div className="stars">★★★★★</div>
             <p>"Clear pricing, professional demeanor, and extremely clean work on our bathroom remodel."</p>
             <h4>- Mark T.</h4>
           </motion.div>
        </motion.div>
      </section>
    </div>
  );
};

export default Home;
