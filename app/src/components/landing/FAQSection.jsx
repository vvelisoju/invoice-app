import { useState } from 'react'
import { IonIcon } from '@ionic/react'
import { chevronDownOutline } from 'ionicons/icons'
import './FAQSection.css'

function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null)
  
  const faqs = [
    {
      question: 'Do I need to register to create an invoice?',
      answer: 'Yes, we use phone OTP authentication for security. Registration takes less than 30 seconds - just enter your phone number and verify the OTP.'
    },
    {
      question: 'Can I generate GST invoices?',
      answer: 'Yes! Our app automatically calculates GST based on your business and customer location. It supports both IGST (interstate) and CGST+SGST (intrastate) with proper tax breakup in PDFs.'
    },
    {
      question: 'Can I use it offline?',
      answer: 'Absolutely. You can create and edit invoice drafts completely offline. They will automatically sync to the server when you\'re back online.'
    },
    {
      question: 'Can I share invoices on WhatsApp?',
      answer: 'Yes! On mobile, you can share PDF invoices directly via WhatsApp with one tap. On desktop, you can download the PDF and share it manually.'
    },
    {
      question: 'Can I customize invoice templates?',
      answer: 'Yes. You can customize colors, add your logo, choose which fields to show/hide, and personalize the layout to match your brand.'
    },
    {
      question: 'Does it work on mobile?',
      answer: 'Yes! We have native Android and iOS apps built with Capacitor. The same features work seamlessly on web, Android, and iOS.'
    },
    {
      question: 'What happens when I reach the free plan limit?',
      answer: 'On the free plan, you can issue up to 10 invoices per month. You can still create unlimited drafts and view/share previously issued invoices. Upgrade to Pro for unlimited invoices.'
    },
    {
      question: 'Can I export my data?',
      answer: 'Pro users can export invoice data to CSV for accounting software integration. All users can download individual invoice PDFs anytime.'
    }
  ]

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section id="faq" className="landing-section">
      <h2 className="section-title">Frequently Asked Questions</h2>
      <p className="section-subtitle">
        Everything you need to know about Simple Invoice
      </p>
      
      <div className="faq-container">
        {faqs.map((faq, index) => (
          <div 
            key={index} 
            className={`faq-item ${openIndex === index ? 'faq-item-open' : ''}`}
            onClick={() => toggleFAQ(index)}
          >
            <div className="faq-question">
              <span>{faq.question}</span>
              <IonIcon 
                icon={chevronDownOutline} 
                className="faq-icon"
              />
            </div>
            {openIndex === index && (
              <div className="faq-answer">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

export default FAQSection
