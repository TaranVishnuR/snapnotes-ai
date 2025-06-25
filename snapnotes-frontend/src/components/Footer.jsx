import React from 'react';
import styled from 'styled-components';
import FadeIn from './FadeIn';
import { motion } from 'framer-motion';
import { FaHeart } from 'react-icons/fa';

const FooterWrap = styled.footer`
  background-color: #2B1974;
  color: #fff;
  text-align: center;
  padding: 2.5rem 1rem;
`;

const FooterText = styled.p`
  font-size: 0.95rem;
  opacity: 0.85;
  margin: 0.4rem 0;
`;

const Brand = styled(motion.h3)`
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  letter-spacing: 0.5px;
  transition: transform 0.9s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const Icon = styled(motion.span)`
  color: #FF5A5F;
  margin: 0 0.25rem;
  vertical-align: middle;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

export default function Footer() {
  return (
    <FadeIn delay={0.2}>
      <FooterWrap>
        <Brand
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          SnapNotes
        </Brand>
        <FooterText>© {new Date().getFullYear()} SnapNotes. All rights reserved.</FooterText>
        <FooterText>
          Crafted with{' '}
          <Icon
            whileHover={{ scale: 1.3, rotate: [0, 15, -15, 0] }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
          >
            <FaHeart />
          </Icon>{' '}
          in India
        </FooterText>
      </FooterWrap>
    </FadeIn>
  );
}
