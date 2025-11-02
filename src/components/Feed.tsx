import BarraSuperior from "./BarraSuperior"

const Feed = () => {

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-black dark:text-white p-8">
      <BarraSuperior />
      <h1 className="text-3xl font-bold">Feed</h1>
      <p className="mt-4 text-lg">
        Este texto deve ficar <span className="text-blue-600 dark:text-yellow-400">azul no claro</span> e{' '}
        <span className="text-yellow-400 dark:text-blue-400">amarelo no escuro</span>.
      </p>
      </div>
  )
}

export default Feed