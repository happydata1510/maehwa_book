import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function upsertReader(name: string, age?: number, className?: string, parentPhone?: string) {
  return prisma.reader.upsert({
    where: { name },
    update: { age, className: className ?? null, parentPhone: parentPhone ?? null },
    create: { name, age, className: className ?? null, parentPhone: parentPhone ?? null },
  });
}

async function upsertBook(title: string, author: string, ageMin?: number, ageMax?: number) {
  return prisma.book.upsert({
    where: { title_author: { title, author } },
    update: { ageMin, ageMax },
    create: { title, author, ageMin, ageMax },
  });
}

function randomDateWithin(days: number): Date {
  const now = Date.now();
  const offset = Math.floor(Math.random() * days);
  return new Date(now - offset * 24 * 60 * 60 * 1000);
}

async function main() {
  const readers = await Promise.all([
    upsertReader("하린", 5, "매화반", "01011112222"),
    upsertReader("지후", 6, "매화반", "01022223333"),
    upsertReader("유진", 7, "국화반", "01033334444"),
    upsertReader("다원", 5, "꿈꾸는 반", "01080782069"),
  ]);

  const books = await Promise.all([
    upsertBook("누가 내 머리에 똥 쌌어?", "베르너 홀츠와르트", 5, 7),
    upsertBook("생쥐와 모자", "존 버닝햄", 5, 7),
    upsertBook("도깨비 방망이", "전래동화", 5, 7),
    upsertBook("안녕, 달", "크리스 홋슨", 5, 7),
    upsertBook("도서관에 간 사자", "미셸 크누드센", 5, 7),
  ]);

  // Generate random readings for last 60 days
  const data = [] as Array<{ readDate: Date; bookId: number; readerId: number; notes?: string }>;
  for (const reader of readers) {
    const n = 80 + Math.floor(Math.random() * 60); // 더 많은 읽기 기록으로 100권 달성 샘플 포함
    for (let i = 0; i < n; i++) {
      const book = books[Math.floor(Math.random() * books.length)];
      data.push({ readDate: randomDateWithin(60), bookId: book.id, readerId: reader.id, notes: undefined });
    }
  }
  // Sort by date ascending for realism
  data.sort((a, b) => a.readDate.getTime() - b.readDate.getTime());
  for (const row of data) {
    await prisma.reading.create({ data: row });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

