import {readFile, writeFile} from 'node:fs/promises';

const replacements = [
  ['assets/studio-wide.webp', 'assets/photography/flow.webp'],
  ['assets/content.webp', 'assets/photography/street.webp'],
  ['assets/growth.webp', 'assets/photography/direction.webp'],
  ['assets/strategy.webp', 'assets/photography/mark.webp'],
  ['Charcoal and gray pixel architecture with a red cube, the visual identity of Render Studio', 'Flowing silver curves against a grainy black background'],
  ['A pixel-built studio camera and framed images in gray with a floating red block', 'A black-and-white street photograph of people gathering outside a small restaurant'],
  ['A geometric pixel camera and framed artwork with a muted red accent', 'A black-and-white street photograph of people gathering outside a small restaurant'],
  ['A staircase of gray pixel blocks with one red cube at the top', 'A lone figure framed by a symmetrical concrete corridor'],
  ['Ascending gray block steps with a muted red block at the top', 'A lone figure framed by a symmetrical concrete corridor'],
  ['A modular creative workspace with a strategic planning board in the studio’s pixel style', 'An expressive black brush mark on textured white paper'],
  ['A studio exploration of a content-production world built from our square-grid identity. The camera, framed images and red focal point bring a shared visual language to a collection of social assets. A real project could carry this direction through videos, post design and a planned content calendar.', 'A photographic mood study exploring everyday stories, human connection and the texture of city life. This reference sets a direction for content that feels observed and personal. A real project could carry that approach through video, social posts and a planned content calendar.'],
  ['A studio exploration of how a brand can visualize progress without overcomplicating the message. A simple staircase and one red focal point form a clear campaign idea. A real project would begin with an audience, a measurable goal and a creative testing plan.', 'A photographic mood study exploring perspective, focus and a clear path forward. Repeating architectural lines guide the eye toward a single human figure. A real project would begin with an audience, a measurable goal and a creative testing plan.'],
  ['მუქი და ნაცრისფერი პიქსელური არქიტექტურა წითელი კუბით - Render Studio-ს ვიზუალური იდენტობა', 'ვერცხლისფერი ტალღოვანი ხაზები მარცვლოვან შავ ფონზე'],
  ['ნაცრისფერი პიქსელური კამერა და ჩარჩოები წითელი ბლოკით', 'შავ-თეთრი ქუჩის ფოტო: პატარა რესტორანთან შეკრებილი ადამიანები'],
  ['გეომეტრიული პიქსელური კამერა და ჩარჩოები წითელი აქცენტით', 'შავ-თეთრი ქუჩის ფოტო: პატარა რესტორანთან შეკრებილი ადამიანები'],
  ['ნაცრისფერი პიქსელური საფეხურები წითელი კუბით მწვერვალზე', 'მარტოხელა ფიგურა სიმეტრიულ ბეტონის დერეფანში'],
  ['აღმავალი ნაცრისფერი საფეხურები წითელი ბლოკით', 'მარტოხელა ფიგურა სიმეტრიულ ბეტონის დერეფანში'],
  ['მოდულური კრეატიული სივრცე და სტრატეგიული დაფა სტუდიის პიქსელურ სტილში', 'შავი ფუნჯის ექსპრესიული კვალი ტექსტურიან თეთრ ქაღალდზე'],
  ['სტუდიის კონცეფცია, რომელიც კონტენტის შექმნის სამყაროს ჩვენი კვადრატული იდენტობით წარმოგვიდგენს. კამერა, ჩარჩოები და წითელი აქცენტი სოციალურ მასალებს ერთიან ვიზუალურ ენას აძლევს. რეალურ პროექტში ეს მიმართულება შეიძლება გაგრძელდეს ვიდეოებით, პოსტების დიზაინითა და კონტენტკალენდრით.', 'ფოტოგრაფიული განწყობის კვლევა ყოველდღიურ ამბებზე, ადამიანურ კავშირსა და ქალაქის ცხოვრების ფაქტურაზე. ეს ვიზუალური რეფერენსი ბუნებრივი და პირადი კონტენტის მიმართულებას განსაზღვრავს. რეალურ პროექტში ეს მიდგომა შეიძლება გაგრძელდეს ვიდეოებით, სოციალური პოსტებითა და კონტენტკალენდრით.'],
  ['სტუდიის კონცეფცია იმის შესახებ, თუ როგორ აჩვენოს ბრენდმა პროგრესი მარტივი გზავნილით. საფეხურები და ერთი წითელი აქცენტი კამპანიის მკაფიო იდეას ქმნის. რეალურ პროექტს დავიწყებდით აუდიტორიის განსაზღვრით, გაზომვადი მიზნითა და კრეატიული ტესტირების გეგმით.', 'ფოტოგრაფიული განწყობის კვლევა პერსპექტივაზე, ფოკუსსა და წინსვლის მკაფიო გზაზე. განმეორებადი არქიტექტურული ხაზები მზერას ერთი ადამიანის ფიგურისკენ მიმართავს. რეალურ პროექტს დავიწყებდით აუდიტორიის განსაზღვრით, გაზომვადი მიზნითა და კრეატიული ტესტირების გეგმით.'],
];

for (const name of ['index.html', 'script.js', 'i18n.js']) {
  const url = new URL(`../${name}`, import.meta.url);
  let source = await readFile(url, 'utf8');
  for (const [before, after] of replacements) source = source.replaceAll(before, after);
  await writeFile(url, source);
}
