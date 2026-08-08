import EditableText from '../components/EditableText';

export default function AboutPage() {
  return (
    <section className="page page-about">
      <EditableText id="about.title" as="h1" defaultValue="About Tanfield Lea Community Centre" />
      <EditableText
        id="about.paragraph1"
        as="p"
        multiline
        defaultValue="Tanfield Lea Community Centre supports local residents and visitors by sharing the latest centre news, events, and booking opportunities."
      />
      <EditableText
        id="about.paragraph2"
        as="p"
        multiline
        defaultValue="The site is designed so staff can update announcements quickly and accept booking requests directly through the booking form."
      />
      <EditableText
        id="about.paragraph3"
        as="p"
        multiline
        defaultValue="If you need help setting up the community centre or adding new sections, we can extend this site with volunteer signups, event calendars, and room availability."
      />
    </section>
  );
}

