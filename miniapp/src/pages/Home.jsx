import Banner from '../components/Banner.jsx';
import ContactButton from '../components/ContactButton.jsx';
import CategoryRibbon from '../components/CategoryRibbon.jsx';

export default function Home({ user, onSelectCategory }) {
  const name = user?.firstName || 'Mehmon';
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Mehmon';

  return (
    <div className="page">
      <div className="header">
        <div>
          <h1 className="title">{name} aka, xush kelibsiz!</h1>
          <p className="subtitle">Assalomu alaykum 🕋</p>
        </div>
        <div className="avatar" title={fullName}>
          {name.charAt(0).toUpperCase()}
        </div>
      </div>

      <Banner />

      <ContactButton />

      <div className="section-title">Kategoriyalar</div>

      <CategoryRibbon onSelect={onSelectCategory} />
    </div>
  );
}
