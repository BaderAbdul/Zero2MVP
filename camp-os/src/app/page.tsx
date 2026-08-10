import Link from 'next/link';
import styles from './landing.module.css';

export default function Home() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <span className={styles.brand}>Camp OS</span>
        <h1 className={styles.title}>نظام تشغيل المعسكر</h1>
        <p className={styles.subtitle}>
          From Zero to MVP — من الفكرة إلى المنتج، في تجربة واحدة.
        </p>
        <Link href="/login" className={styles.cta}>
          تسجيل الدخول
        </Link>
      </div>
    </div>
  );
}
