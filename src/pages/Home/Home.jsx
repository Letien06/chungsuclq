import React from 'react';
import { HeroBanner } from '../../components/HeroBanner/HeroBanner';
import { Ticker } from '../../components/Ticker/Ticker';
import { PackageSelector } from '../../components/PackageSelector/PackageSelector';
import { FriendCodeInput } from '../../components/FriendCodeInput/FriendCodeInput';
import { OrderSummary } from '../../components/OrderSummary/OrderSummary';
import { TrustBadge } from '../../components/TrustBadge/TrustBadge';
import styles from './Home.module.css';

export const Home = () => {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.layoutGrid}>
          {/* Left Column: Form & Services */}
          <div className={styles.leftColumn}>
            <Ticker />
            <HeroBanner />
            <PackageSelector />
            <FriendCodeInput />

          </div>

          {/* Right Column: Sticky Checkout Sidebar */}
          <aside className={styles.rightColumn}>
            <OrderSummary />
            <TrustBadge />
          </aside>
        </div>
      </div>
    </main>
  );
};
