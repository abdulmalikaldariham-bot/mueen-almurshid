import { BrandMark } from './icons';

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="brand">
        <BrandMark />
        <div>
          <h1 className="brand-name">مُعين المرشد</h1>
          <p className="brand-tagline">مولّد أسئلة مساعدة للمرشد المهني</p>
        </div>
      </div>
      <p className="lede">
        اكتب حالة المسترشد، ودع الأداة تقترح لك أسئلة تساعدك على إدارة الحوار بصورة أعمق وأكثر تنظيمًا.
      </p>
    </header>
  );
}
