import React, { useState } from 'react';
import { HeroBanner } from '../../components/HeroBanner/HeroBanner';
import { PackageSelector } from '../../components/PackageSelector/PackageSelector';
import { QuantitySelector } from '../../components/QuantitySelector/QuantitySelector';
import { FriendCodeInput } from '../../components/FriendCodeInput/FriendCodeInput';
import { NoteInput } from '../../components/NoteInput/NoteInput';
import { OrderSummary } from '../../components/OrderSummary/OrderSummary';
import { TrustBadge } from '../../components/TrustBadge/TrustBadge';
import { HelpCircle, ChevronDown, ChevronUp, Star, Flame, Award, Clock } from 'lucide-react';
import styles from './Home.module.css';

export const Home = () => {
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const faqs = [
    {
      q: 'Thời gian cày xong sự kiện là bao lâu?',
      a: 'Hệ thống chạy tự động bằng server phân phối, các gói thường hoàn thành chỉ từ 30 giây đến 3 phút sau khi bạn đặt đơn!'
    },
    {
      q: 'Sử dụng dịch vụ có bị khóa tài khoản không?',
      a: 'Hoàn toàn an toàn 100%! Cơ chế của chúng tôi chỉ sử dụng tính năng "Mời bạn bè (Friend Code)" chính thống do Garena phát hành, không can thiệp file game, không cần mật khẩu.'
    },
    {
      q: 'Sau khi cày xong kiểm tra ở đâu?',
      a: 'Bạn chỉ cần vào game Liên Quân Mobile > Mục Sự Kiện > Chung Sức. Bạn sẽ thấy thanh tiến độ Bỉ đã đầy và có thể mở khóa nhận ngay Rương Trang Phục SS/SSS!'
    },
    {
      q: 'Tôi muốn đặt số lượng lớn cho nhiều nick thì làm sao?',
      a: 'Bạn chỉ cần gạt bật nút "MUA SỐ LƯỢNG LỚN" ở mục 3, sau đó dán danh sách mã mời (mỗi dòng 1 mã). Hệ thống sẽ tự động phân phối cày cùng lúc tất cả các nick.'
    }
  ];

  const reviews = [
    {
      user: 'Bảo***Long',
      rank: 'Thách Đấu',
      package: 'FULL 3 RƯƠNG',
      rating: 5,
      time: '15 phút trước',
      comment: 'Cày siêu tốc thật sự, bấm đặt xong vô game thấy 200 Bỉ rồi, mở ra ngay skin SS Valhein!'
    },
    {
      user: 'Tuấn***Anh',
      rank: 'Chiến Tướng',
      package: 'GÓI SĂN SSS VIP',
      rating: 5,
      time: '32 phút trước',
      comment: 'Uy tín nha anh em, nhập mỗi friend code là xong không lo mất acc gì hết.'
    },
    {
      user: 'Minh***Khôi',
      rank: 'Tinh Anh',
      package: 'RƯƠNG SKIN SS',
      rating: 5,
      time: '1 giờ trước',
      comment: 'Giá rẻ nhất thị trường rồi, nạp tiền tự động duyệt nhanh 5s.'
    }
  ];

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.layoutGrid}>
          {/* Left Column: Form & Services */}
          <div className={styles.leftColumn}>
            <HeroBanner />
            <PackageSelector />
            <QuantitySelector />
            <FriendCodeInput />
            <NoteInput />

            {/* Customer Reviews Section */}
            <div className={styles.reviewsSection}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitleBox}>
                  <Award size={18} className={styles.reviewIcon} />
                  <h3 className={styles.sectionTitle}>ĐÁNH GIÁ TỪ GAME THỦ</h3>
                </div>
                <div className={styles.ratingOverview}>
                  <div className={styles.stars}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill="#ffb703" color="#ffb703" />
                    ))}
                  </div>
                  <span>4.9/5.0 (2,400+ đánh giá)</span>
                </div>
              </div>

              <div className={styles.reviewsGrid}>
                {reviews.map((rev, idx) => (
                  <div key={idx} className={styles.reviewCard}>
                    <div className={styles.reviewTop}>
                      <div className={styles.reviewUser}>
                        <span className={styles.reviewName}>{rev.user}</span>
                        <span className={styles.rankBadge}>{rev.rank}</span>
                      </div>
                      <span className={styles.reviewTime}>{rev.time}</span>
                    </div>

                    <div className={styles.reviewStars}>
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} size={12} fill="#ffb703" color="#ffb703" />
                      ))}
                      <span className={styles.reviewPackageTag}>{rev.package}</span>
                    </div>

                    <p className={styles.reviewText}>"{rev.comment}"</p>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ Accordion Section */}
            <div className={styles.faqSection}>
              <div className={styles.faqHeader}>
                <HelpCircle size={18} className={styles.faqIcon} />
                <h3 className={styles.faqTitle}>CÂU HỎI THƯỜNG GẶP (FAQ)</h3>
              </div>

              <div className={styles.accordion}>
                {faqs.map((faq, index) => {
                  const isOpen = openFaqIndex === index;
                  return (
                    <div key={index} className={styles.accordionItem}>
                      <button
                        className={styles.accordionHeader}
                        onClick={() => toggleFaq(index)}
                        aria-expanded={isOpen}
                      >
                        <span className={styles.questionText}>{faq.q}</span>
                        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>

                      {isOpen && (
                        <div className={styles.accordionBody}>
                          <p>{faq.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
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
