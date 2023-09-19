
export function ErrorModal({ errorText, onClose }: { errorText: string, onClose: () => void }) {
    if (!errorText) return null

    return (
        <div className="z-100 fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center">
            <div className="fixed rounded-md bg-red-50 p-4 z-20 h-fit w-64">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">There was an error</h3>
                        <div className="mt-2 text-sm text-red-700">
                            {errorText}
                        </div>
                        <button className="rounded-md bg-red-400 text-white border border-red-600 px-3 mt-2 hover:bg-red-500"
                            onClick={onClose}>
                            Ok
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}