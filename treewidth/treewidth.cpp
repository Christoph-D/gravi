// This program takes as input an undirected graph G and an integer k.
// It computes whether the treewidth of G is at most k.  It can happen
// (and it is very likely for large graphs) that the program runs into
// a timeout.
//
// Compile with: g++ -std=c++14 -O2 -Wall treewidth.cpp -lboost_iostreams
//
// The input must be provided on stdin and describes an undirected
// graph.  The first line contains three integers: The number of
// vertices, the number of edges, and the desired treewidth.  This is
// followed by one line per edge, each line consisting of two
// integers, the two vertices connected by this edge.
//
// This program requires "timelimit": sudo apt-get install timelimit
//
// Please change the parameters below to suit your needs.
#define Z3_PATH "../z3"
#define Z3_TIMEOUT_SECONDS "5"

#include <iostream>
#include <string>
#include <vector>
#include <numeric>
#include <unistd.h>
#include <sys/wait.h>
#include <boost/iostreams/device/file_descriptor.hpp>
#include <boost/iostreams/stream.hpp>
using namespace std;
namespace io = boost::iostreams;

void generate_declarations(ostream& out, int number_of_vertices) {
  // pos-i says to which position vertex i goes in the linear order.
  for(int i = 0; i < number_of_vertices; ++i)
    out << "(declare-const pos-" << i << " Int)\n";
  // pred-i-j is true if vertex i is a predecessor of j.
  for(int i = 0; i < number_of_vertices; ++i) {
    for(int j = 0; j < number_of_vertices; ++j) {
      if(i == j)
        continue;
      out << "(declare-const pred-" << i << "-" << j << " Bool)\n";
    }
  }
}

void generate_basic_assertions(ostream& out, int number_of_vertices, int treewidth) {
  // The pos variables must be pairwise distinct because they describe
  // a linear order of the vertices.
  out << "(assert (distinct";
  for(int i = 0; i < number_of_vertices; ++i)
    out << " pos-" << i;
  out << "))\n";
  // If vertices j and l have a common predecessor i, then there
  // should be an edge between j and l oriented according to the
  // linear order.  That is, j should be predecessor of l if j comes
  // before l in the linear order, and vice-versa.
  for(int i = 0; i < number_of_vertices; ++i) {
    for(int j = 0; j < number_of_vertices; ++j) {
      for(int l = j + 1; l < number_of_vertices; ++l) {
        if(i == j || i == l)
          continue;
        out << "(assert (=> (and pred-"
            << i << "-" << j << " pred-" << i << "-" << l << ") "
            << "(ite (< pos-" << j << " pos-" << l << ") "
            << "pred-" << j << "-" << l << " pred-" << l << "-" << j
            << ")))\n";
      }
    }
  }
  // A vertex can have at most treewidth many successors for the
  // linear order to witness our desired treewidth.
  for(int i = 0; i < number_of_vertices; ++i) {
    out << "(assert (<=";
    for(int j = 0; j < number_of_vertices - 1; ++j)
      out << " (+";
    out << " 0";
    for(int j = 0; j < number_of_vertices; ++j)
      if(i != j)
        out << " (ite pred-" << i << "-" << j << " 1 0))";
    out << " " << treewidth << "))\n";
  }
}

void generate_edge_assertions(ostream& out, const vector<pair<int, int>>& edges) {
  // If there is an edge between i and j, then i is a predecessor of j
  // if i comes before j in the linear order, and vice-versa.
  for(auto e : edges) {
    const int i = e.first;
    const int j = e.second;
    out << "(assert (ite (< pos-" << i << " pos-" << j << ") "
        << "pred-" << i << "-" << j << " pred-" << j << "-" << i << "))\n";
  }
}

void generate_constraints(ostream& out, int number_of_vertices,
                          const vector<pair<int, int>>& edges,
                          int treewidth) {
  generate_declarations(out, number_of_vertices);
  generate_basic_assertions(out, number_of_vertices, treewidth);
  generate_edge_assertions(out, edges);
}

void get_model(ostream& out, istream& in, int number_of_vertices) {
  string s;
  int pos[number_of_vertices];
  for(int i = 0; i < number_of_vertices; ++i) {
    // Ask the solver where vertex i should go.  endl is important
    // here to flush the stream.
    out << "(eval pos-" << i << ")" << endl;
    getline(in, s);
    string cleaned;
    for(char c : s)
      if(c == '-' || (c >= '0' && c <= '9'))
        cleaned += c;
    pos[i] = stoi(cleaned);
  }
  // pos[i] tells us where vertex i should go.  Now we can print the
  // vertices in their correct order.
  vector<int> vertices(number_of_vertices);
  iota(vertices.begin(), vertices.end(), 0);
  sort(vertices.begin(), vertices.end(), [&pos](int a, int b) { return pos[a] < pos[b]; });
  for(int i = 0; i < number_of_vertices; ++i) {
    cout << vertices[i] << "\n";
  }
}

class z3 {
public:
  z3() {
    // in = stdin of the subprocess
    int in[2], out[2];
    if(pipe(in) != 0 || pipe(out) != 0) {
      cout << "Error: Could not create pipe.\n";
      return;
    }
    child = fork();
    if(child == -1) {
      cout << "Error: Could not fork.\n";
      return;
    }
    if(child == 0) {
      dup2(in[0], 0);
      dup2(out[1], 1);
      close(in[1]);
      close(out[0]);
      char* empty_env[] = { nullptr };
      if(execle("/usr/bin/timelimit",
                "/usr/bin/timelimit", "-q", "-t" Z3_TIMEOUT_SECONDS, "-T1",
                Z3_PATH, "-smt2", "-in", nullptr, empty_env) == -1) {
        cout << "Error: Could not spawn the z3 process.\n";
        return;
      }
    }
    close(in[0]);
    close(out[1]);
    stdin.open(io::file_descriptor_sink(in[1], io::file_descriptor_flags::close_handle));
    stdout.open(io::file_descriptor_source(out[0], io::file_descriptor_flags::close_handle));
  }
  ~z3() {
    stdin.close();
    stdout.close();
    int status;
    waitpid(child, &status, 0);
  }

  io::stream<io::file_descriptor_sink> stdin;
  io::stream<io::file_descriptor_source> stdout;

private:
  pid_t child;
};

void run_z3(int number_of_vertices,
            const vector<pair<int, int>>& edges,
            int treewidth) {
  z3 z3;
  generate_constraints(z3.stdin, number_of_vertices, edges, treewidth);

  // Check if the constraints are satisfiable, that is, if the
  // treewidth is small enough.  endl is important here to flush the
  // stream.
  z3.stdin << "(check-sat)" << endl;
  string s;
  getline(z3.stdout, s);
  if(s == "unsat") {
    cout << "Treewidth is larger.\n";
    return;
  }
  if(s != "sat") {
    // If the answer if neither "sat" nor "unsat", we assume that it
    // must be a timeout.  In reality, it could also be another error.
    cout << "\nTimeout.\n";
    return;
  }
  // z3 claims "sat", so the treewidth of the graph is at most our
  // desired treewidth.
  cout << "Treewidth is smaller or equal.\n";
  // Ask z3 for the model.
  get_model(z3.stdin, z3.stdout, number_of_vertices);
}

const int MAX_VERTICES = 50;
const int MAX_EDGES = MAX_VERTICES * (MAX_VERTICES - 1) / 2;

int main() {
  cout << "Content-Type: text/plain\n\n";

  int number_of_vertices;
  cin >> number_of_vertices;
  if(!cin.good() || number_of_vertices < 1 || number_of_vertices > MAX_VERTICES) {
    cout << "Invalid number of vertices.\n";
    cout << "The number must be an integer between 1 and " << MAX_VERTICES << ".\n";
    return 1;
  }

  int number_of_edges;
  cin >> number_of_edges;
  if(!cin.good() || number_of_edges < 0 || number_of_edges > MAX_EDGES) {
    cout << "Invalid number of edges.\n";
    cout << "The number must be an integer between 0 and " << MAX_EDGES << ".\n";
    return 1;
  }

  int treewidth;
  cin >> treewidth;
  if(!cin.good() || treewidth < 1 || treewidth >= number_of_vertices) {
    cout << "Invalid desired treewidth.\n";
    cout << "The number must be an integer between 1 and " << number_of_vertices - 1 << ".\n";
    return 1;
  }

  vector<pair<int, int>> edges;
  for(int i = 0; i < number_of_edges; ++i) {
    int a, b;
    cin >> a >> b;
    if(!cin.good() ||
       a < 0 || a >= number_of_vertices ||
       b < 0 || b >= number_of_vertices) {
      cout << "Invalid vertex id at input line " << (i + 2) << ".\n";
      return 1;
    }
    edges.push_back(make_pair(a, b));
  }
  run_z3(number_of_vertices, edges, treewidth);
}
