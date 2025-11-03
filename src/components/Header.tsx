import { useNavigate } from "react-router-dom";

interface HeaderProps {
  titulo: string;
}

const Header: React.FC<HeaderProps> = ({ titulo }) => {
  const navigate = useNavigate();

  const handleHome = () => {
    navigate("/");
    window.location.reload();
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <header
      className="bg-purple-600 text-white w-full fixed top-0 left-0 z-50 shadow-lg"
      role="banner"
    >
      <div className="flex h-16 px-2 max-w-screen-xl mx-auto">
        <div className="flex w-1/3 items-center justify-start">
          <button
            onClick={handleHome}
            className="px-3 py-2 bg-purple-600 border-2 border-white rounded-xl 
                       font-semibold text-sm hover:bg-purple-700 transition-colors 
                       whitespace-nowrap min-w-32"
            aria-label="Ir para o Feed"
          >
            Feed
          </button>
        </div>

        <div className="flex w-1/3 items-center justify-center">
          <h1
            className="text-xl md:text-2xl font-bold tracking-tight"
            aria-level={1}
          >
            {titulo}
          </h1>
        </div>

        <div className="flex w-1/3 items-center justify-end">
          <button
            onClick={handleBack}
            className="px-3 py-2 bg-purple-600 border-2 border-white rounded-xl 
                       font-semibold text-sm hover:bg-purple-700 transition-colors 
                       whitespace-nowrap min-w-32"
            aria-label="Voltar para a página anterior"
          >
            Voltar
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;