import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Footer from '../components/Footer';
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
        <motion.div className="badge" variants={fadeUpVariant}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--confirm-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          Licensed & Insured
        </motion.div>
        <motion.div className="badge" variants={fadeUpVariant}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--confirm-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          Upfront Pricing
        </motion.div>
        <motion.div className="badge" variants={fadeUpVariant}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--confirm-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          24/7 Support
        </motion.div>
      </motion.section>

      {/* How It Works */}
      <section className="how-it-works-section">
        <motion.h2
          className="section-title"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUpVariant}
        >
          How It Works
        </motion.h2>

        <motion.div
          className="how-grid"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          <motion.div className="how-step" variants={fadeUpVariant}>
            <div className="how-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--clear-blue)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <span className="how-number">1</span>
            <h3>Post Your Job</h3>
            <p>Describe your plumbing issue, set a date and preferred time.</p>
          </motion.div>
          <motion.div className="how-step" variants={fadeUpVariant}>
            <div className="how-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--clear-blue)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
              </svg>
            </div>
            <span className="how-number">2</span>
            <h3>Get Matched</h3>
            <p>Browse verified professionals or let us match you with the best fit.</p>
          </motion.div>
          <motion.div className="how-step" variants={fadeUpVariant}>
            <div className="how-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--clear-blue)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <span className="how-number">3</span>
            <h3>Job Done</h3>
            <p>Your plumber completes the work. Pay securely and leave a review.</p>
          </motion.div>
        </motion.div>
      </section>

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
             <div className="service-icon">
               <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--clear-blue)" strokeWidth="1.5"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>
             </div>
             <h3>Leak Repair</h3>
             <p>Fast, reliable detection and sealing of pipe leaks minimizing structural water damage.</p>
          </motion.div>
          <motion.div className="card-panel service-card" variants={fadeUpVariant} whileHover={{ y: -6, boxShadow: "0 20px 60px rgba(0,0,0,0.12)" }}>
             <div className="service-icon">
               <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--clear-blue)" strokeWidth="1.5"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
             </div>
             <h3>Pipe Installation</h3>
             <p>High-end structural pipe laying for remodels, new builds, and commercial venues.</p>
          </motion.div>
          <motion.div className="card-panel service-card" variants={fadeUpVariant} whileHover={{ y: -6, boxShadow: "0 20px 60px rgba(0,0,0,0.12)" }}>
             <div className="service-icon">
               <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--clear-blue)" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
             </div>
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
             <div className="stars">
               {[1,2,3,4,5].map(i => (
                 <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="var(--amber-cta)" stroke="var(--amber-cta)" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
               ))}
             </div>
             <p>"The plumber arrived in 20 minutes and fixed our burst pipe flawlessly. Highly recommended!"</p>
             <h4>— Sarah J.</h4>
           </motion.div>
           <motion.div className="card-panel testimonial-card" variants={fadeUpVariant} whileHover={{ y: -6, boxShadow: "0 20px 60px rgba(0,0,0,0.12)" }}>
             <div className="stars">
               {[1,2,3,4,5].map(i => (
                 <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="var(--amber-cta)" stroke="var(--amber-cta)" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
               ))}
             </div>
             <p>"Clear pricing, professional demeanor, and extremely clean work on our bathroom remodel."</p>
             <h4>— Mark T.</h4>
           </motion.div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
