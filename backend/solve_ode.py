import sys
import json
import traceback
import re
from sympy import symbols, Function, Eq, dsolve, classify_ode, sympify, latex, diff, integrate, exp, simplify

def generate_linear_steps(eq, y_func_sym, indep_sym):
    y = y_func_sym(indep_sym)
    x = indep_sym
    steps = []
    steps.append({"title": "Identify equation type", "detail": "This is a First-Order Linear Differential Equation.", "latex": ""})
    steps.append({"title": "Standard Form", "detail": f"Ensure the equation is in the form {latex(y)}' + P({latex(x)}){latex(y)} = Q({latex(x)})", "latex": ""})
    steps.append({"title": "Integrating Factor", "detail": f"Compute the integrating factor \\mu({latex(x)}) = e^{{\\int P({latex(x)})d{latex(x)}}}", "latex": f"\\mu({latex(x)}) = e^{{\\int P({latex(x)}) d{latex(x)}}}"})
    steps.append({"title": "Multiply and Integrate", "detail": f"Multiply both sides by \\mu({latex(x)}) and integrate to solve for {latex(y)}.", "latex": f"{latex(y)} = \\frac{{1}}{{\\mu({latex(x)})}} \\left( \\int \\mu({latex(x)}) Q({latex(x)}) d{latex(x)} + C \\right)"})
    return steps

def generate_separable_steps(eq, y_func_sym, indep_sym):
    y = y_func_sym(indep_sym)
    x = indep_sym
    dy = f"d{y_func_sym.name}"
    dx = f"d{indep_sym.name}"
    steps = []
    steps.append({"title": "Identify equation type", "detail": "This is a Separable Differential Equation.", "latex": ""})
    steps.append({"title": "Separate Variables", "detail": f"Rearrange the equation so all {y_func_sym.name} terms are on one side with {dy}, and all {indep_sym.name} terms on the other with {dx}.", "latex": f"f({y_func_sym.name}) {dy} = g({indep_sym.name}) {dx}"})
    steps.append({"title": "Integrate Both Sides", "detail": "Integrate both sides of the equation.", "latex": f"\\int f({y_func_sym.name}) {dy} = \\int g({indep_sym.name}) {dx}"})
    steps.append({"title": f"Solve for {y_func_sym.name}", "detail": f"Solve the integrated equation explicitly for {latex(y)} if possible, and add the constant of integration C.", "latex": ""})
    return steps

def generate_bernoulli_steps(eq, y_func_sym, indep_sym):
    y = y_func_sym(indep_sym)
    x = indep_sym
    v_str = 'v' if y_func_sym.name != 'v' else 'w'
    steps = []
    steps.append({"title": "Identify equation type", "detail": "This is a Bernoulli Differential Equation.", "latex": f"{latex(y)}' + P({latex(x)}){latex(y)} = Q({latex(x)}){latex(y)}^n"})
    steps.append({"title": f"Divide by {latex(y)}^n", "detail": f"Divide the entire equation by {latex(y)}^n to prepare for substitution.", "latex": f"{latex(y)}^{{-n}}{latex(y)}' + P({latex(x)}){latex(y)}^{{1-n}} = Q({latex(x)})"})
    steps.append({"title": "Substitution", "detail": f"Let {v_str} = {latex(y)}^{{1-n}}. Then {v_str}' = (1-n){latex(y)}^{{-n}}{latex(y)}'.", "latex": f"{v_str} = {latex(y)}^{{1-n}}"})
    steps.append({"title": "Solve Linear Equation", "detail": f"Substitute {v_str} into the equation to get a linear ODE in terms of {v_str}, and solve using the integrating factor method.", "latex": ""})
    steps.append({"title": "Back-substitute", "detail": f"Replace {v_str} with {latex(y)}^{{1-n}} and solve for {latex(y)}.", "latex": ""})
    return steps

def generate_exact_steps(eq, y_func_sym, indep_sym):
    y = y_func_sym(indep_sym)
    x = indep_sym
    dx = f"d{indep_sym.name}"
    dy = f"d{y_func_sym.name}"
    steps = []
    steps.append({"title": "Identify equation type", "detail": "This is an Exact Differential Equation.", "latex": f"M({latex(x)}, {y_func_sym.name}) {dx} + N({latex(x)}, {y_func_sym.name}) {dy} = 0"})
    steps.append({"title": "Check Exactness", "detail": f"Verify that \u2202M/\u2202{y_func_sym.name} = \u2202N/\u2202{latex(x)}.", "latex": f"\\frac{{\\partial M}}{{\\partial {y_func_sym.name}}} = \\frac{{\\partial N}}{{\\partial {latex(x)}}}"})
    steps.append({"title": f"Integrate M w.r.t {latex(x)}", "detail": f"Integrate M({latex(x)},{y_func_sym.name}) with respect to {latex(x)} to find the potential function \u03a8({latex(x)},{y_func_sym.name}) up to a function of {y_func_sym.name}.", "latex": f"\\Psi({latex(x)}, {y_func_sym.name}) = \\int M({latex(x)}, {y_func_sym.name}) {dx} + h({y_func_sym.name})"})
    steps.append({"title": f"Find h({y_func_sym.name})", "detail": f"Differentiate \u03a8 with respect to {y_func_sym.name}, set it equal to N({latex(x)},{y_func_sym.name}), and solve for h'({y_func_sym.name}), then integrate to find h({y_func_sym.name}).", "latex": ""})
    steps.append({"title": "Final Solution", "detail": f"The implicit solution is \u03a8({latex(x)},{y_func_sym.name}) = C.", "latex": ""})
    return steps

def generate_newtons_cooling_steps(eq, y_func_sym, indep_sym):
    y = y_func_sym(indep_sym)
    t = indep_sym
    steps = []
    steps.append({"title": "Identify equation type", "detail": "This is Newton's Law of Cooling, an applied first-order differential equation.", "latex": f"{latex(y)}' = -k({latex(y)} - T_a)"})
    steps.append({"title": "Separate Variables", "detail": f"Rearrange to group {y_func_sym.name} terms on one side and {t.name} terms on the other.", "latex": f"\\frac{{1}}{{{latex(y)} - T_a}} d{y_func_sym.name} = -k d{t.name}"})
    steps.append({"title": "Integrate Both Sides", "detail": "Integrate both sides of the separated equation.", "latex": f"\\ln|{latex(y)} - T_a| = -k {t.name} + C"})
    steps.append({"title": f"Solve for {y_func_sym.name}", "detail": f"Exponentiate both sides to explicitly solve for {y_func_sym.name}({t.name}).", "latex": f"{latex(y)} = T_a + C e^{{-k {t.name}}}"})
    return steps

def generate_growth_decay_steps(eq, y_func_sym, indep_sym):
    y = y_func_sym(indep_sym)
    t = indep_sym
    steps = []
    steps.append({"title": "Identify equation type", "detail": "This represents Exponential Growth or Decay.", "latex": f"{latex(y)}' = k {latex(y)}"})
    steps.append({"title": "Separate Variables", "detail": f"Group {y_func_sym.name} on one side and {t.name} on the other.", "latex": f"\\frac{{1}}{{{latex(y)}}} d{y_func_sym.name} = k d{t.name}"})
    steps.append({"title": "Integrate Both Sides", "detail": "Integrate to find the natural logarithm.", "latex": f"\\ln|{latex(y)}| = k {t.name} + C"})
    steps.append({"title": f"Solve for {y_func_sym.name}", "detail": f"Exponentiate both sides to explicitly solve for {y_func_sym.name}({t.name}).", "latex": f"{latex(y)} = C e^{{k {t.name}}}"})
    return steps

def generate_logistic_growth_steps(eq, y_func_sym, indep_sym):
    y = y_func_sym(indep_sym)
    t = indep_sym
    steps = []
    steps.append({"title": "Identify equation type", "detail": "This represents Logistic Growth, often used in population dynamics.", "latex": f"{latex(y)}' = r {latex(y)} (1 - {latex(y)}/K)"})
    steps.append({"title": "Separate Variables", "detail": f"Group {y_func_sym.name} on one side and {t.name} on the other.", "latex": f"\\frac{{1}}{{{latex(y)}(1 - {latex(y)}/K)}} d{y_func_sym.name} = r d{t.name}"})
    steps.append({"title": "Partial Fractions", "detail": "Use partial fraction decomposition to integrate the left side.", "latex": f"\\left( \\frac{{1}}{{{latex(y)}}} + \\frac{{1/K}}{{1 - {latex(y)}/K}} \\right) d{y_func_sym.name} = r d{t.name}"})
    steps.append({"title": f"Solve for {y_func_sym.name}", "detail": "Integrate both sides and solve algebraically.", "latex": ""})
    return steps

def parse_equation(eq_str):
    indep_var = 'x'
    dep_var = 'y'
    
    leibniz_match = re.search(r'd([a-zA-Z]+)\s*/\s*d([a-zA-Z]+)', eq_str)
    if leibniz_match:
        dep_var = leibniz_match.group(1)
        indep_var = leibniz_match.group(2)
        eq_str = re.sub(rf'd{dep_var}\s*/\s*d{indep_var}', f"diff({dep_var}({indep_var}), {indep_var})", eq_str)
    
    prime_match = re.search(r'([a-zA-Z]+)\'+', eq_str)
    if prime_match:
        dep_var = prime_match.group(1)
        indep_var = 't' if dep_var in ['T', 'P', 'v', 'N', 'A', 'Q'] else 'x'
        
        def repl_prime(m):
            var = m.group(1)
            primes = m.group(2)
            return f"diff({var}({indep_var})" + f", {indep_var}" * len(primes) + ")"
            
        eq_str = re.sub(r'([a-zA-Z]+)(\'+)', repl_prime, eq_str)

    eq_str = re.sub(fr'\b{dep_var}\b(?!\()', f'{dep_var}({indep_var})', eq_str)
    
    words = set(re.findall(r'\b[a-zA-Z_]\w*\b', eq_str))
    special = {'diff', 'sin', 'cos', 'tan', 'exp', 'log', 'ln', 'sqrt', 'pi', dep_var, indep_var}
    constants = words - special
    
    local_dict = {}
    local_dict[indep_var] = symbols(indep_var)
    func_sym = Function(dep_var)
    local_dict[dep_var] = func_sym
    
    for c in constants:
        local_dict[c] = symbols(c, real=True)
        
    return eq_str, local_dict, func_sym, local_dict[indep_var], dep_var, indep_var

def solve_equation_logic(equation_str):
    try:
        try:
            eq_str, local_dict, y_func_sym, indep_sym, dep_name, indep_name = parse_equation(equation_str)
        except Exception as parse_e:
            raise Exception("Invalid syntax or unsupported variable notation.")

        try:
            if '=' in eq_str:
                lhs_str, rhs_str = eq_str.split('=', 1)
                lhs = sympify(lhs_str, locals=local_dict)
                rhs = sympify(rhs_str, locals=local_dict)
                eq = Eq(lhs, rhs)
            else:
                eq = sympify(eq_str, locals=local_dict)
        except Exception as symp_e:
            raise Exception("Failed to parse math equation. Please check for missing operators (like * between variables).")
            
        y = y_func_sym(indep_sym)
        hints = classify_ode(eq, y)
        if not hints:
            raise Exception("Could not classify the differential equation.")
            
        best_hint = hints[0]
        
        # Check heuristics for applied problems based on variables
        is_newtons_cooling = dep_name == 'T' and ('Ta' in local_dict or 'Tm' in local_dict)
        is_logistic = dep_name == 'P' and ('K' in local_dict) and ('r' in local_dict or 'k' in local_dict)
        is_growth_decay = (dep_name in ['P', 'N', 'A', 'Q']) and ('factorable' in hints or 'separable' in hints) and not is_logistic
        
        try:
            solution = dsolve(eq, y)
        except Exception as sol_e:
            raise Exception("Math engine failed to find a closed-form solution.")
            
        sol_latex = latex(solution)
        
        # Determine specific steps
        if is_newtons_cooling:
            best_hint = "Newton's Law of Cooling"
            steps = generate_newtons_cooling_steps(eq, y_func_sym, indep_sym)
        elif is_logistic:
            best_hint = "Logistic Growth"
            steps = generate_logistic_growth_steps(eq, y_func_sym, indep_sym)
        elif is_growth_decay:
            best_hint = "Exponential Growth/Decay"
            steps = generate_growth_decay_steps(eq, y_func_sym, indep_sym)
        elif "1st_linear" in hints:
            best_hint = "1st Linear"
            steps = generate_linear_steps(eq, y_func_sym, indep_sym)
        elif "separable" in hints or "factorable" in hints:
            best_hint = "Separable"
            steps = generate_separable_steps(eq, y_func_sym, indep_sym)
        elif "Bernoulli" in best_hint or "bernoulli" in best_hint.lower():
            steps = generate_bernoulli_steps(eq, y_func_sym, indep_sym)
        elif "1st_exact" in hints:
            best_hint = "1st Exact"
            steps = generate_exact_steps(eq, y_func_sym, indep_sym)
        else:
            steps = [
                {"title": "Identify equation type", "detail": f"Classified as: {best_hint.replace('_', ' ')}", "latex": ""},
                {"title": "Apply Algorithm", "detail": "Use specialized integration techniques for this type.", "latex": ""},
            ]
            
        steps.append({"title": "Final Answer", "detail": "After integration and simplification:", "latex": sol_latex})
        
        plot_data = []
        try:
            import numpy as np
            from sympy import lambdify
            sol_expr = solution.rhs
            for sym in sol_expr.free_symbols:
                if str(sym).startswith('C'):
                    sol_expr = sol_expr.subs(sym, 1)
                elif str(sym) != indep_name:
                    sol_expr = sol_expr.subs(sym, 2) # Arbitrary value for constants like k, Ta, r, K
            
            f = lambdify(indep_sym, sol_expr, 'numpy')
            x_vals = np.linspace(-5, 5, 100)
            y_vals = f(x_vals)
            
            for i in range(len(x_vals)):
                if np.isreal(y_vals[i]) and not np.isnan(y_vals[i]) and not np.isinf(y_vals[i]):
                    y_val = float(y_vals[i])
                    if abs(y_val) < 1000:
                        plot_data.append({"x": float(f"{x_vals[i]:.2f}"), "y": float(f"{y_val:.2f}")})
        except Exception as graph_e:
            pass 
            
        result = {
            "success": True,
            "equation": latex(eq),
            "type": best_hint.replace('_', ' ').title(),
            "solution_latex": sol_latex,
            "steps": steps,
            "plotData": plot_data
        }
        return result
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    if len(sys.argv) > 1:
        eq_str = sys.argv[1]
    else:
        eq_str = sys.stdin.read().strip()
        
    if not eq_str:
        print(json.dumps({"success": False, "error": "No equation provided"}))
        sys.exit(1)
        
    res = solve_equation_logic(eq_str)
    print(json.dumps(res))
