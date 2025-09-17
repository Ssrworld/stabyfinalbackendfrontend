// frontend/src/components/FAQ.jsx

import React, { useState } from 'react';
import './FAQ.css';

const faqs = [
  {
    question: "What is the Stabylink Rewards Program?",
    answer: "It's a part of the Stabylink Wallet ecosystem that rewards members for helping the community grow. You join with a one-time $20 USDT contribution and earn by referring others and expanding your team."
  },
  {
    question: "Is this a pyramid or Ponzi scheme?",
    answer: "No. Our system is completely transparent and sustainable. Rewards are generated from community growth and fees generated within the system, not from new investments. Every transaction is trackable, and earnings are based directly on the expansion of your team."
  },
  {
    question: "Can I earn if I don't refer anyone?",
    answer: "Yes. Our system allows for spillovers, meaning referrals from your upline can fill slots in your matrix, helping you complete your pool and earn rewards. However, referring directly accelerates your earnings."
  },
  {
    question: "How do I get my money?",
    answer: "Your earnings are credited to your 'Withdrawable Balance'. You can request a withdrawal in USDT to your personal BEP-20 wallet at any time. Withdrawals are processed automatically and quickly."
  },
  {
    question: "What is USDT BEP-20 and where do I get it?",
    answer: "USDT BEP-20 is a stablecoin on the Binance Smart Chain (BSC). You can get it from major exchanges like Binance, KuCoin, or through wallets like Trust Wallet and deposit it into your Stabylink wallet."
  },
  {
    question: "Are there any monthly or hidden fees?",
    answer: "No. There is only a one-time $20 contribution to join. A standard 10% service fee is applied only to withdrawals, which helps with system maintenance and development."
  }
];

const FAQItem = ({ faq, index, toggleFAQ }) => {
  return (
    <div
      className={"faq " + (faq.open ? 'open' : '')}
      key={index}
      onClick={() => toggleFAQ(index)}
    >
      <div className="faq-question">
        {faq.question}
        <i className="fa-solid fa-chevron-down"></i>
      </div>
      <div className="faq-answer">
        {faq.answer}
      </div>
    </div>
  );
};


const FAQ = () => {
    const [faqList, setFaqList] = useState(
        faqs.map(faq => ({ ...faq, open: false }))
    );

    const toggleFAQ = index => {
        setFaqList(faqList.map((faq, i) => {
            if (i === index) {
                faq.open = !faq.open
            } else {
                faq.open = false;
            }
            return faq;
        }));
    }

    return (
        <section className="faq-section">
            <div className="section-container">
                {/* --- समाधान: हेडिंग (h2) को सबटाइटल (p) से पहले रखा गया है --- */}
                <h2>Frequently Asked Questions</h2>
                <p className="section-subtitle">
                    Your questions, answered. Transparency is our core principle.
                </p>
                <div className="faqs">
                    {faqList.map((faq, i) => (
                        <FAQItem faq={faq} index={i} key={i} toggleFAQ={toggleFAQ} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FAQ;