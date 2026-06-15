import { AddBookForm } from '@/app/Components/AddBookForm'

export const Home = async () => {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <AddBookForm />
    </div>
  );
}

export default Home