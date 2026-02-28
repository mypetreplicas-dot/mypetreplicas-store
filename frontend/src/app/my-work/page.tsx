import { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'My Work | My Pet Replicas',
  description: 'A showcase of custom pet replicas I\'ve created. Each piece is hand-painted with love and attention to detail.',
};

// Placeholder gallery - you'll add your actual images here
const galleryItems = [
  {
    id: 1,
    title: 'Custom Dog Replica',
    description: 'Golden Retriever with personalized name plate',
    image: '/images/replicas/placeholder-1.jpg',
    category: 'Dogs',
  },
  {
    id: 2,
    title: 'Custom Cat Replica',
    description: 'Tabby cat with detailed markings',
    image: '/images/replicas/placeholder-2.jpg',
    category: 'Cats',
  },
  {
    id: 3,
    title: 'Memorial Replica',
    description: 'Cherished pet memorial with halo',
    image: '/images/replicas/placeholder-3.jpg',
    category: 'Memorials',
  },
  // Add more items as you create them
];

export default function MyWorkPage() {
  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-6">
            Gallery of <span className="text-terra-400">Custom Replicas</span>
          </h1>
          <p className="text-lg text-neutral-400 leading-relaxed">
            Each piece is a labor of love, hand-painted to capture the unique personality
            and spirit of every pet. Here&apos;s a showcase of some of my favorite creations.
          </p>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {galleryItems.map((item) => (
              <div
                key={item.id}
                className="group relative bg-neutral-900/50 rounded-xl overflow-hidden border border-neutral-800 hover:border-terra-500/30 transition-all duration-300"
              >
                {/* Image Container */}
                <div className="aspect-square relative bg-neutral-800">
                  {/* Placeholder - Replace with actual images */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg
                      className="w-24 h-24 text-neutral-700"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
                      />
                    </svg>
                  </div>

                  {/* Uncomment when you have actual images */}
                  {/* <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  /> */}

                  {/* Category Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-terra-600/90 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                      {item.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-neutral-400">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Placeholder Message */}
          <div className="mt-16 text-center max-w-2xl mx-auto">
            <div className="p-8 bg-terra-500/5 border border-terra-500/10 rounded-xl">
              <svg
                className="w-12 h-12 text-terra-400 mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
                />
              </svg>
              <h3 className="text-lg font-semibold text-white mb-2">
                Gallery Coming Soon
              </h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Replace the placeholder images above with photos of your actual work.
                Add images to <code className="px-2 py-1 bg-neutral-800 rounded text-terra-400">/public/images/replicas/</code>
                {' '}and update the <code className="px-2 py-1 bg-neutral-800 rounded text-terra-400">galleryItems</code> array
                in this file.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 bg-gradient-to-br from-terra-900/20 to-terra-950/20 border border-terra-700/20 rounded-2xl">
            <h2 className="text-3xl font-display font-bold text-white mb-4">
              Want Your Own Custom Replica?
            </h2>
            <p className="text-neutral-400 mb-8 max-w-2xl mx-auto">
              Each piece is unique and hand-painted to capture your pet&apos;s personality.
              Start your custom order today.
            </p>
            <a
              href="/product/custom-pet-replica"
              className="inline-block px-8 py-4 bg-terra-600 hover:bg-terra-500 text-white font-semibold rounded-full transition-all shadow-[0_0_32px_rgba(212,112,62,0.3)] hover:shadow-[0_0_48px_rgba(212,112,62,0.5)]"
            >
              Start Creating
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
