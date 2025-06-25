import React from 'react';
import styled from 'styled-components';
import FadeIn from './FadeIn';
import { motion } from 'framer-motion';
import {
  FaMicrophone,
  FaFileAudio,
  FaStickyNote,
  FaGlobe
} from 'react-icons/fa';

const Section = styled.section`
  background:rgb(255, 255, 255);
  padding: 4rem 1rem;
  text-align: center;
`;

const Heading = styled.h2`
  font-size: 2rem;
  margin-bottom: 2rem;
  color: #1F1F1F;
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2rem;
  max-width: 1000px;
  margin: 0 auto;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const FeatureCard = styled.div`
  padding: 2rem;
  border-radius: 12px;
  background: ${props => props.$bg || '#f9f9f9'};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  will-change: transform;
  cursor: pointer;

  &:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  }
`;

const IconWrapper = styled.div`
  font-size: 2rem;
  margin-bottom: 1rem;
  color: #5C33FF;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: color 0.3s ease;

  ${FeatureCard}:hover & {
    color: #3e1fb9;
  }
`;

const Title = styled.h3`
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
  color: #5C33FF;
`;

const Description = styled.p`
  color: #555;
  font-size: 1rem;
`;

// 🧠 Dynamic Features Array
const features = [
  {
    icon: <span aria-label="Microphone Icon"><FaMicrophone /></span>,
    title: 'Live Mic Input',
    description: 'Instantly capture lectures directly from the mic.',
    bg: '#f4f1ff'
  },
  {
    icon: <span aria-label="Audio File Icon"><FaFileAudio /></span>,
    title: 'Audio File Upload',
    description: 'Upload audio files anytime from recorded classes.',
    bg: '#f0f6ff'
  },
  {
    icon: <span aria-label="Sticky Note Icon"><FaStickyNote /></span>,
    title: 'Smart Summaries',
    description: 'AI-generated notes tailored to your subject, not just raw transcripts.',
    bg: '#fffaf3'
  },
  {
    icon: <span aria-label="Globe Icon"><FaGlobe /></span>,
    title: 'Multilingual Support',
    description: 'Supports multiple languages for diverse, global classrooms.',
    bg: '#f4fffa'
  }
];


export default function FeatureSection() {
  return (
    <FadeIn>
      <Section>
        <Heading>Why SnapNotes?</Heading>
        <FeatureGrid>
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <FeatureCard $bg={feature.bg}>
                <IconWrapper>{feature.icon}</IconWrapper>
                <Title>{feature.title}</Title>
                <Description>{feature.description}</Description>
              </FeatureCard>
            </motion.div>
          ))}
        </FeatureGrid>
      </Section>
    </FadeIn>
  );
}
