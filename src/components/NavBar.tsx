import LogoSvg from './LogoSvg';

export default function NavBar() {
  return (
    <>
      <nav className="w-full z-20 top-0 start-0 border-b border-gray-700 bg-black mb-6">
        <div className="max-w-screen-xl flex flex-wrap items-center justify-between h-[8.88vh]">
          <LogoSvg className="h-auto ml-4 w-[25vw] sm:w-[15vw] xl:w-[7vw] sm:ml-20 xl:ml-40" />
        </div>
      </nav>
      <img className="bg-pattern-2nd-layer" src="/v2/pattern.png" alt=""></img>
    </>
  );
}
