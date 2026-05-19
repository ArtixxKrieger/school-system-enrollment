<div class="page-content">
  <div class="content-wrapper">

    <div class="layout-grid">

      <div class="left-panel">
        <div id="courseCardsContainer" class="course-cards-container"></div>
      </div>

      <div class="right-panel">

        <div class="info-card">
          <h2 id="courseInfoTitle">Select a course</h2>
          <p id="courseInfoDesc">Choose a program on the left to see enrolled students.</p>
          <div class="tags" id="courseInfoTags"></div>
        </div>

        <div class="filter-card">
          <div class="filter-grid">
            <input class="input" id="courseSearchInput" placeholder="Search students" autocomplete="off">
            <select class="input" id="courseYearLevelFilter">
              <option value="all">All Year Levels</option>
              <option value="1st">1st Year</option>
              <option value="2nd">2nd Year</option>
              <option value="3rd">3rd Year</option>
              <option value="4th">4th Year</option>
            </select>
            <select class="input" id="courseStatusFilter">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div class="table-card">
          <h3 id="courseTableTitle">Enrolled Students (0)</h3>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Year Level</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
            </tbody>
          </table>

          <div class="course-pagination-container">
            <div class="course-pagination-info">
              <span id="coursePaginationInfo">Showing 0 of 0</span>
            </div>
            <div class="course-pagination-controls">
              <button type="button" class="course-pagination-btn" id="coursePrevBtn" disabled>Previous</button>
              <div class="course-pagination-pages" id="coursePaginationPages"></div>
              <button type="button" class="course-pagination-btn" id="courseNextBtn" disabled>Next</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</div>
