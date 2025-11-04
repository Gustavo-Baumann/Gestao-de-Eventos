import { useState } from 'react';

interface ModalUploadImagemProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (file: File) => void;
}

export default function ModalUploadImagem({ isOpen, onClose, onConfirm }: ModalUploadImagemProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && selected.type.startsWith('image/')) {
      setFile(selected);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selected);
    }
  };

  const handleConfirm = () => {
    if (file) {
      onConfirm(file);
      setFile(null);
      setPreview(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Alterar foto de perfil</h3>

        <div className="mb-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
          />
        </div>

        {preview && (
          <div className="mb-4 flex justify-center">
            <img src={preview} alt="Pré-visualização" className="w-32 h-32 object-cover rounded-full" />
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!file}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed transition"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}