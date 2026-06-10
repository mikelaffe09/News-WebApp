import { Link } from 'react-router-dom';

const SITE_NAME = 'The Chronicle';

const footerLinks = {
  News: [
    { label: 'World', href: '/category/world' },
    { label: 'Politics', href: '/category/politics' },
    { label: 'Business', href: '/category/business' },
    { label: 'Technology', href: '/category/technology' },
    { label: 'Science', href: '/category/science' },
  ],
  Culture: [
    { label: 'Arts', href: '/category/culture' },
    { label: 'Sports', href: '/category/sports' },
    { label: 'Health', href: '/category/health' },
    { label: 'Lifestyle', href: '/category/lifestyle' },
    { label: 'Opinion', href: '/category/opinion' },
  ],
  Company: [
    { label: 'About Us', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Advertise', href: '#' },
    { label: 'Contact', href: '#' },
  ],
  Tools: [
    { label: 'Subscribe', href: '#' },
    { label: 'Newsletter', href: '#' },
    { label: 'CMS Login', href: '/cms' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 pt-12 pb-8">
        <div className="mb-8 pb-8 border-b border-slate-700">
          <Link to="/"><span className="font-serif text-2xl font-bold text-white">{SITE_NAME}</span></Link>
          <p className="mt-2 text-sm text-slate-400 max-w-md">Independent journalism. Trusted reporting. Uncompromising standards.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">{section}</h3>
              <ul className="space-y-2">
                {links.map(link => (
                  <li key={link.label}>
                    <Link to={link.href} className="text-sm text-slate-400 hover:text-white transition-colors">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
