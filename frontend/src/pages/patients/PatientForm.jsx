
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {id ? 'Edit Patient' : 'Add New Patient'}
        </h1>
        <p className="text-gray-600 mt-1">
          {id ? 'Update patient information' : 'Enter patient details to create a new record'}
        </p>
      </div>

      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
            Personal Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Full Name *</label>
              <input
                type="text"
                className="input"
                placeholder="Enter full name"
                {...register('fullName', { required: 'Full name is required' })}
              />
              {errors.fullName && (
                <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>
              )}
            </div>

            <div>
              <label className="label">Age</label>
              <input
                type="number"
                className="input"
                placeholder="Age"
                min="0"
                max="150"
                {...register('age', {
                  min: { value: 0, message: 'Age must be positive' },
                  max: { value: 150, message: 'Age must be realistic' }
                })}
              />
              {errors.age && (
                <p className="text-red-500 text-sm mt-1">{errors.age.message}</p>
              )}
            </div>

            <div>
              <label className="label">Gender</label>
              <select className="input" {...register('gender')}>
                <option value="">Select gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="label">Blood Group</label>
              <select className="input" {...register('bloodGroup')}>
                <option value="">Select blood group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
            Contact Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Phone Number *</label>
              <input
                type="tel"
                className="input"
                placeholder="+91 1234567890"
                {...register('phone', {
                  required: 'Phone number is required',
                  pattern: {
                    value: /^[+]?[\d\s-()]+$/,
                    message: 'Invalid phone number'
                  }
                })}
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="label">Emergency Contact</label>
              <input
                type="tel"
                className="input"
                placeholder="+91 1234567890"
                {...register('emergencyContact')}
              />
            </div>

            <div className="md:col-span-2">
              <label className="label">Address</label>
              <textarea
                className="input"
                rows="3"
                placeholder="Enter complete address"
                {...register('address')}
              />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
            Medical Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="label">Known Allergies</label>
              <input
                type="text"
                className="input"
                placeholder="e.g., Penicillin, Peanuts (comma separated)"
                {...register('allergies')}
              />
              <p className="text-sm text-gray-500 mt-1">
                Enter multiple allergies separated by commas
              </p>
            </div>

            <div>
              <label className="label">Medical History</label>
              <textarea
                className="input"
                rows="4"
                placeholder="Previous conditions, surgeries, ongoing treatments, etc."
                {...register('medicalHistory')}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : id ? 'Update Patient' : 'Add Patient'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/patients')}
            className="btn btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => reset()}
            className="btn btn-secondary sm:ml-auto"
            disabled={isSubmitting}
          >
            Clear Form
          </button>
        </div>
      </form>
    </div>
  );
}
