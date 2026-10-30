import { Reveal } from '../../components/Reveal';

const PRINCIPLES = [
  {
    index: '01',
    title: 'Explore, don’t scroll past',
    body: 'Every Mind Matter experience is something you operate — pause, zoom, adjust and observe. Explanation follows discovery.',
  },
  {
    index: '02',
    title: 'Honest by default',
    body: 'We label simulations as simulations. Where data comes from a dataset, we name the source and the date it was current.',
  },
  {
    index: '03',
    title: 'Built for the device you own',
    body: 'Lightweight canvas rendering instead of heavy 3D engines, with reduced-motion and low-power modes on by request.',
  },
];

export function PrincipleBand() {
  return (
    <section className="section principles" aria-labelledby="principles-title">
      <div className="shell principles__inner">
        <Reveal className="principles__intro">
          <p className="eyebrow">Why Mind Matter</p>
          <h2 id="principles-title" className="h2">
            A science studio, not a feed.
          </h2>
          <p className="lead muted">
            Articles tell you what we know. Interactive experiences let you feel
            why it is true. Mind Matter is built around the second idea.
          </p>
        </Reveal>

        <ol className="principles__list">
          {PRINCIPLES.map((item, index) => (
            <Reveal
              as="li"
              key={item.index}
              delay={index * 90}
              className="principles__item"
              surface="row"
            >
              <span className="principles__index">{item.index}</span>
              <h3 className="principles__title">{item.title}</h3>
              <p className="principles__body">{item.body}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
